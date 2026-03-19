// server/reviewRoutes.js
// Express router for place reviews.
// All write operations require Clerk auth + student email verification.

import { Router } from "express";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifyClerkToken } from "./middleware/verifyClerkToken.js";
import { isStudentEmail } from "./middleware/verifyStudent.js";
import { notifyAdminEmails, insertAdminNotifications } from "./lib/emailService.js";
import logger from "./lib/logger.js";
import { z } from "zod";

const router = Router();

// ── Zod schemas ────────────────────────────────────────────────────────────────

const reviewBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(1000),
  is_anonymous: z.boolean().optional().default(false),
});

const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  body: z.string().min(10).max(1000).optional(),
  is_anonymous: z.boolean().optional(),
});

const placeIdSchema = z.string().uuid();
const reviewIdSchema = z.string().uuid();

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/reviews/:placeId — fetch reviews for a place (paginated)
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/reviews/:placeId", async (req, res) => {
  const parsed = placeIdSchema.safeParse(req.params.placeId);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid place ID format" });
  }
  const placeId = parsed.data;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);

  try {
    const { data, error, count } = await supabaseAdmin
      .from("reviews")
      .select("*, app_users!inner(full_name, avatar_url)", { count: "exact" })
      .eq("place_id", placeId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error({ err: error }, "GET /reviews query error");
      return res.status(500).json({ error: error.message });
    }

    // Strip author info for anonymous reviews
    const reviews = (data || []).map((r) => {
      if (r.is_anonymous) {
        return {
          ...r,
          clerk_user_id: undefined,
          app_users: { full_name: "Anonymous Student", avatar_url: null },
        };
      }
      return r;
    });

    return res.json({ data: reviews, count: count || 0, offset, limit });
  } catch (err) {
    logger.error({ err }, "GET /reviews unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/reviews/:placeId — create review (auth + student email required)
// ═══════════════════════════════════════════════════════════════════════════════

router.post("/reviews/:placeId", verifyClerkToken(), async (req, res) => {
  const parsed = placeIdSchema.safeParse(req.params.placeId);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid place ID format" });
  }

  const bodyParsed = reviewBodySchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      error: "Invalid review data",
      details: bodyParsed.error.flatten(),
    });
  }

  const placeId = parsed.data;
  const { rating, body, is_anonymous } = bodyParsed.data;
  const clerkUserId = req.clerkUserId;

  try {
    // 1. Lookup user email from app_users
    const { data: user, error: userErr } = await supabaseAdmin
      .from("app_users")
      .select("email, verified_student")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (userErr || !user) {
      return res.status(403).json({ error: "User not found in database" });
    }

    // 2. Check student email domain
    const verifiedStudent = isStudentEmail(user.email);
    if (!verifiedStudent) {
      return res.status(403).json({
        error: "Only verified Christ University students can write reviews",
      });
    }

    // 3. Update verified_student flag if needed
    if (!user.verified_student) {
      await supabaseAdmin
        .from("app_users")
        .update({ verified_student: true })
        .eq("clerk_user_id", clerkUserId);
    }

    // 4. Verify place exists
    const { data: place, error: placeErr } = await supabaseAdmin
      .from("places")
      .select("id")
      .eq("id", placeId)
      .single();

    if (placeErr || !place) {
      return res.status(404).json({ error: "Place not found" });
    }

    // 5. Insert review (UNIQUE constraint handles one-per-user-per-place)
    const { data: review, error: insertErr } = await supabaseAdmin
      .from("reviews")
      .insert({
        place_id: placeId,
        clerk_user_id: clerkUserId,
        rating,
        body,
        is_anonymous,
        verified_student: true,
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        return res.status(409).json({ error: "You have already reviewed this place" });
      }
      logger.error({ err: insertErr }, "POST /reviews insert error");
      return res.status(500).json({ error: insertErr.message });
    }

    // 6. Update aggregate counts on places
    await updatePlaceReviewAggregates(placeId);

    // 7. Notify admins about new review
    try {
      const { data: placeInfo } = await supabaseAdmin
        .from("places")
        .select("name")
        .eq("id", placeId)
        .single();
      const placeName = placeInfo?.name || "Unknown Place";
      notifyAdminEmails("new_review", {
        placeName, rating, body,
      });
      insertAdminNotifications("new_review",
        `New review for ${placeName}`,
        `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} — ${body.slice(0, 80)}`,
        `/place/${placeId}`, { reviewId: review.id, placeId });
    } catch (_) { /* non-blocking */ }

    logger.info({ placeId, clerkUserId }, "Review created");
    return res.status(201).json(review);
  } catch (err) {
    logger.error({ err }, "POST /reviews unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/reviews/:reviewId — edit own review
// ═══════════════════════════════════════════════════════════════════════════════

router.put("/reviews/:reviewId", verifyClerkToken(), async (req, res) => {
  const parsed = reviewIdSchema.safeParse(req.params.reviewId);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid review ID format" });
  }

  const bodyParsed = reviewUpdateSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      error: "Invalid update data",
      details: bodyParsed.error.flatten(),
    });
  }

  const reviewId = parsed.data;
  const updates = bodyParsed.data;
  const clerkUserId = req.clerkUserId;

  try {
    // Verify ownership
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("reviews")
      .select("clerk_user_id, place_id, status")
      .eq("id", reviewId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (existing.clerk_user_id !== clerkUserId) {
      return res.status(403).json({ error: "You can only edit your own reviews" });
    }

    if (existing.status !== "active") {
      return res.status(400).json({ error: "Cannot edit a deleted or flagged review" });
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("reviews")
      .update(updates)
      .eq("id", reviewId)
      .select()
      .single();

    if (updateErr) {
      logger.error({ err: updateErr }, "PUT /reviews update error");
      return res.status(500).json({ error: updateErr.message });
    }

    // Re-aggregate if rating changed
    if (updates.rating !== undefined) {
      await updatePlaceReviewAggregates(existing.place_id);
    }

    return res.json(updated);
  } catch (err) {
    logger.error({ err }, "PUT /reviews unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/reviews/:reviewId — soft-delete own review
// ═══════════════════════════════════════════════════════════════════════════════

router.delete("/reviews/:reviewId", verifyClerkToken(), async (req, res) => {
  const parsed = reviewIdSchema.safeParse(req.params.reviewId);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid review ID format" });
  }

  const reviewId = parsed.data;
  const clerkUserId = req.clerkUserId;
  const userRole = req.userRole;

  try {
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("reviews")
      .select("clerk_user_id, place_id, status")
      .eq("id", reviewId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Allow self-delete or admin/superadmin delete
    const isSelf = existing.clerk_user_id === clerkUserId;
    const isAdmin = ["admin", "superadmin"].includes(userRole);
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: "You can only delete your own reviews" });
    }

    const status = isSelf ? "deleted_by_user" : "deleted_by_admin";

    const { error: deleteErr } = await supabaseAdmin
      .from("reviews")
      .update({
        status,
        deleted_at: new Date().toISOString(),
        deleted_by: clerkUserId,
      })
      .eq("id", reviewId);

    if (deleteErr) {
      logger.error({ err: deleteErr }, "DELETE /reviews error");
      return res.status(500).json({ error: deleteErr.message });
    }

    await updatePlaceReviewAggregates(existing.place_id);

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "DELETE /reviews unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/reviews/:reviewId/helpful — increment helpful_count
// POST /api/reviews/:reviewId/not-helpful — increment not_helpful_count
// ═══════════════════════════════════════════════════════════════════════════════

router.post("/reviews/:reviewId/helpful", verifyClerkToken(), async (req, res) => {
  return handleHelpfulness(req, res, "helpful_count");
});

router.post("/reviews/:reviewId/not-helpful", verifyClerkToken(), async (req, res) => {
  return handleHelpfulness(req, res, "not_helpful_count");
});

async function handleHelpfulness(req, res, column) {
  const parsed = reviewIdSchema.safeParse(req.params.reviewId);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid review ID format" });
  }

  const reviewId = parsed.data;

  try {
    // Fetch current count
    const { data: review, error: fetchErr } = await supabaseAdmin
      .from("reviews")
      .select(`id, ${column}`)
      .eq("id", reviewId)
      .eq("status", "active")
      .single();

    if (fetchErr || !review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("reviews")
      .update({ [column]: review[column] + 1 })
      .eq("id", reviewId);

    if (updateErr) {
      logger.error({ err: updateErr }, `POST /reviews/${column} error`);
      return res.status(500).json({ error: updateErr.message });
    }

    return res.json({ success: true, [column]: review[column] + 1 });
  } catch (err) {
    logger.error({ err }, `POST /reviews/${column} unexpected error`);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ── Helper: recalculate place aggregate review stats ────────────────────────

async function updatePlaceReviewAggregates(placeId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("place_id", placeId)
      .eq("status", "active");

    if (error || !data) return;

    const count = data.length;
    const avg = count > 0
      ? parseFloat((data.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
      : 0;

    await supabaseAdmin
      .from("places")
      .update({ review_count: count, avg_review: avg })
      .eq("id", placeId);
  } catch (err) {
    logger.error({ err }, "updatePlaceReviewAggregates failed");
  }
}

export default router;
