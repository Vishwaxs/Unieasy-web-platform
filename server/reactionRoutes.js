// server/reactionRoutes.js
// Express router for user reactions (like, dislike, bookmark).
// All operations require Clerk auth.

import { Router } from "express";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifyClerkToken } from "./middleware/verifyClerkToken.js";
import logger from "./lib/logger.js";
import { z } from "zod";

const router = Router();

const placeIdSchema = z.string().uuid();
const reactionSchema = z.enum(["like", "dislike", "bookmark"]);

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/reactions/:placeId/:reaction — toggle reaction
// ═══════════════════════════════════════════════════════════════════════════════

router.post(
  "/reactions/:placeId/:reaction",
  verifyClerkToken(),
  async (req, res) => {
    const placeValid = placeIdSchema.safeParse(req.params.placeId);
    const reactionValid = reactionSchema.safeParse(req.params.reaction);

    if (!placeValid.success) {
      return res.status(400).json({ error: "Invalid place ID format" });
    }
    if (!reactionValid.success) {
      return res.status(400).json({ error: "Invalid reaction type. Use: like, dislike, bookmark" });
    }

    const placeId = placeValid.data;
    const reaction = reactionValid.data;
    const clerkUserId = req.clerkUserId;

    try {
      // Check if reaction already exists
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("user_reactions")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .eq("place_id", placeId)
        .eq("reaction", reaction)
        .maybeSingle();

      if (fetchErr) {
        logger.error({ err: fetchErr }, "Reaction fetch error");
        return res.status(500).json({ error: fetchErr.message });
      }

      let toggled;

      if (existing) {
        // Remove existing reaction (toggle off)
        const { error: delErr } = await supabaseAdmin
          .from("user_reactions")
          .delete()
          .eq("id", existing.id);

        if (delErr) {
          logger.error({ err: delErr }, "Reaction delete error");
          return res.status(500).json({ error: delErr.message });
        }
        toggled = false;
      } else {
        // Handle mutual exclusivity: like and dislike cancel each other
        if (reaction === "like" || reaction === "dislike") {
          const opposite = reaction === "like" ? "dislike" : "like";
          await supabaseAdmin
            .from("user_reactions")
            .delete()
            .eq("clerk_user_id", clerkUserId)
            .eq("place_id", placeId)
            .eq("reaction", opposite);
        }

        // Insert new reaction
        const { error: insertErr } = await supabaseAdmin
          .from("user_reactions")
          .insert({
            clerk_user_id: clerkUserId,
            place_id: placeId,
            reaction,
          });

        if (insertErr) {
          logger.error({ err: insertErr }, "Reaction insert error");
          return res.status(500).json({ error: insertErr.message });
        }
        toggled = true;
      }

      // Update aggregate counts
      await updateReactionCounts(placeId);

      return res.json({ toggled, reaction });
    } catch (err) {
      logger.error({ err }, "POST /reactions unexpected error");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/reactions/user — get all reactions for the current user
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/reactions/user", verifyClerkToken(), async (req, res) => {
  const clerkUserId = req.clerkUserId;

  try {
    const { data, error } = await supabaseAdmin
      .from("user_reactions")
      .select("place_id, reaction, created_at")
      .eq("clerk_user_id", clerkUserId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error({ err: error }, "GET /reactions/user error");
      return res.status(500).json({ error: error.message });
    }

    return res.json({ data: data || [] });
  } catch (err) {
    logger.error({ err }, "GET /reactions/user unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/reactions/:placeId/counts — get reaction counts for a place
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/reactions/:placeId/counts", async (req, res) => {
  const parsed = placeIdSchema.safeParse(req.params.placeId);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid place ID format" });
  }

  const placeId = parsed.data;

  try {
    const { data: place, error } = await supabaseAdmin
      .from("places")
      .select("like_count, dislike_count, bookmark_count")
      .eq("id", placeId)
      .single();

    if (error || !place) {
      return res.status(404).json({ error: "Place not found" });
    }

    return res.json(place);
  } catch (err) {
    logger.error({ err }, "GET /reactions/counts unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Helper: recalculate aggregate counts ────────────────────────────────────

async function updateReactionCounts(placeId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_reactions")
      .select("reaction")
      .eq("place_id", placeId);

    if (error || !data) return;

    const counts = { like_count: 0, dislike_count: 0, bookmark_count: 0 };
    for (const row of data) {
      if (row.reaction === "like") counts.like_count++;
      else if (row.reaction === "dislike") counts.dislike_count++;
      else if (row.reaction === "bookmark") counts.bookmark_count++;
    }

    await supabaseAdmin
      .from("places")
      .update(counts)
      .eq("id", placeId);
  } catch (err) {
    logger.error({ err }, "updateReactionCounts failed");
  }
}

export default router;
