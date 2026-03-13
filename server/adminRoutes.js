// server/adminRoutes.js
// Express router for admin and superadmin endpoints.
// All routes are protected by Clerk token verification + role check.

import { Router } from "express";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifyClerkToken } from "./middleware/verifyClerkToken.js";
import { notifyAdmins } from "./lib/notifyAdmins.js";
import logger from "./lib/logger.js";

const router = Router();

// ─── Allowed role values (whitelist) ────────────────────────────────────────
const VALID_ROLES = ["student", "merchant", "admin", "superadmin"];

// ─── Helper: insert audit log ───────────────────────────────────────────────
async function auditLog(actorId, actorRole, action, targetType, targetId, details = {}) {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_id: actorId,
    actor_role: actorRole,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  });
  if (error) logger.error({ err: error }, "Failed to write audit log");
}

// ═══════════════════════════════════════════════════════════════════════════════
// AD MANAGEMENT (admin + superadmin)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/ads/pending
 * Returns all ads with status='pending', newest first.
 */
router.get(
  "/ads/pending",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("ads")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error({ err: error }, "GET /ads/pending");
        return res.status(500).json({ error: error.message });
      }
      return res.json(data);
    } catch (err) {
      logger.error({ err }, "GET /ads/pending unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/admin/ads/:id/approve
 * Sets ad status to 'active' and records who approved it.
 */
router.post(
  "/ads/:id/approve",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    const adId = req.params.id;
    try {
      const { data, error } = await supabaseAdmin
        .from("ads")
        .update({
          status: "active",
          approved_by: req.clerkUserId,
          approved_at: new Date().toISOString(),
        })
        .eq("id", adId)
        .select()
        .single();

      if (error) {
        logger.error({ err: error, adId }, "POST /ads/:id/approve");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, "approve_ad", "ad", adId, {
        new_status: "active",
      });

      return res.json({ message: "Ad approved", ad: data });
    } catch (err) {
      logger.error({ err }, "POST /ads/:id/approve unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/admin/ads/:id/reject
 * Sets ad status to 'rejected' with an optional reason.
 * Body: { reason?: string }
 */
router.post(
  "/ads/:id/reject",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    const adId = req.params.id;
    const reason = typeof req.body?.reason === "string" ? req.body.reason.slice(0, 500) : "";

    try {
      const { data, error } = await supabaseAdmin
        .from("ads")
        .update({
          status: "rejected",
          rejected_reason: reason,
          approved_by: req.clerkUserId,
          approved_at: new Date().toISOString(),
        })
        .eq("id", adId)
        .select()
        .single();

      if (error) {
        logger.error({ err: error, adId }, "POST /ads/:id/reject");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, "reject_ad", "ad", adId, {
        new_status: "rejected",
        reason,
      });

      return res.json({ message: "Ad rejected", ad: data });
    } catch (err) {
      logger.error({ err }, "POST /ads/:id/reject unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// USER ROLE MANAGEMENT (superadmin only)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/users
 * Returns all users (for the superadmin dashboard).
 */
router.get(
  "/users",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("app_users")
        .select("id, clerk_user_id, email, full_name, role, created_at, role_updated_at")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error({ err: error }, "GET /users");
        return res.status(500).json({ error: error.message });
      }
      return res.json(data);
    } catch (err) {
      logger.error({ err }, "GET /users unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/admin/users/role
 * Change a user's role.
 * Body: { clerkUserId: string, newRole: string }
 * Only superadmin can call this.
 */
router.post(
  "/users/role",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    const { clerkUserId, newRole } = req.body || {};

    // Input validation
    if (!clerkUserId || typeof clerkUserId !== "string") {
      return res.status(400).json({ error: "Missing or invalid clerkUserId" });
    }
    if (!VALID_ROLES.includes(newRole)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
    }

    // Prevent superadmin from demoting themselves
    if (clerkUserId === req.clerkUserId && newRole !== "superadmin") {
      return res.status(400).json({ error: "Cannot change your own role" });
    }

    try {
      // Get current role for audit
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("app_users")
        .select("role")
        .eq("clerk_user_id", clerkUserId)
        .single();

      if (fetchErr || !existing) {
        return res.status(404).json({ error: "User not found" });
      }

      const oldRole = existing.role;

      const { data, error } = await supabaseAdmin
        .from("app_users")
        .update({ role: newRole })
        .eq("clerk_user_id", clerkUserId)
        .select()
        .single();

      if (error) {
        logger.error({ err: error }, "POST /users/role");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, "change_role", "user", clerkUserId, {
        old_role: oldRole,
        new_role: newRole,
      });

      return res.json({ message: `Role changed to ${newRole}`, user: data });
    } catch (err) {
      logger.error({ err }, "POST /users/role unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS (superadmin only)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/audit-logs
 * Returns recent audit log entries (last 100).
 */
router.get(
  "/audit-logs",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        logger.error({ err: error }, "GET /audit-logs");
        return res.status(500).json({ error: error.message });
      }
      return res.json(data);
    } catch (err) {
      logger.error({ err }, "GET /audit-logs unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// MERCHANT UPGRADE REQUESTS (admin + superadmin)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/merchant-requests
 * Returns all merchant upgrade requests, newest first.
 */
router.get(
  "/merchant-requests",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("merchant_upgrade_requests")
        .select("*, app_users!merchant_upgrade_requests_clerk_user_id_fkey(email, full_name)")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error({ err: error }, "GET /merchant-requests");
        return res.status(500).json({ error: error.message });
      }
      return res.json(data);
    } catch (err) {
      logger.error({ err }, "GET /merchant-requests unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/admin/merchant-requests/:id/approve
 * Approves a merchant upgrade request and sets the user role to merchant.
 */
router.post(
  "/merchant-requests/:id/approve",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    const requestId = req.params.id;
    try {
      const { data: request, error: fetchErr } = await supabaseAdmin
        .from("merchant_upgrade_requests")
        .select("clerk_user_id, status")
        .eq("id", requestId)
        .single();

      if (fetchErr || !request) {
        return res.status(404).json({ error: "Request not found" });
      }
      if (request.status !== "pending") {
        return res.status(400).json({ error: `Request already ${request.status}` });
      }

      // Approve the request
      const { error: updateErr } = await supabaseAdmin
        .from("merchant_upgrade_requests")
        .update({
          status: "approved",
          reviewed_by: req.clerkUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateErr) {
        return res.status(500).json({ error: updateErr.message });
      }

      // Upgrade user role to merchant
      const { error: roleErr } = await supabaseAdmin
        .from("app_users")
        .update({ role: "merchant" })
        .eq("clerk_user_id", request.clerk_user_id);

      if (roleErr) {
        logger.error({ err: roleErr }, "Failed to update user role after merchant approval");
      }

      await auditLog(req.clerkUserId, req.userRole, "approve_merchant", "merchant_request", requestId, {
        target_user: request.clerk_user_id,
      });

      return res.json({ message: "Merchant request approved" });
    } catch (err) {
      logger.error({ err }, "POST /merchant-requests/:id/approve unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/admin/merchant-requests/:id/reject
 * Rejects a merchant upgrade request with an optional reason.
 * Body: { reason?: string }
 */
router.post(
  "/merchant-requests/:id/reject",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    const requestId = req.params.id;
    const reason = typeof req.body?.reason === "string" ? req.body.reason.slice(0, 500) : "";

    try {
      const { data: request, error: fetchErr } = await supabaseAdmin
        .from("merchant_upgrade_requests")
        .select("clerk_user_id, status")
        .eq("id", requestId)
        .single();

      if (fetchErr || !request) {
        return res.status(404).json({ error: "Request not found" });
      }
      if (request.status !== "pending") {
        return res.status(400).json({ error: `Request already ${request.status}` });
      }

      const { error: updateErr } = await supabaseAdmin
        .from("merchant_upgrade_requests")
        .update({
          status: "rejected",
          reviewed_by: req.clerkUserId,
          review_note: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateErr) {
        return res.status(500).json({ error: updateErr.message });
      }

      await auditLog(req.clerkUserId, req.userRole, "reject_merchant", "merchant_request", requestId, {
        target_user: request.clerk_user_id,
        reason,
      });

      return res.json({ message: "Merchant request rejected" });
    } catch (err) {
      logger.error({ err }, "POST /merchant-requests/:id/reject unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW MODERATION (admin + superadmin)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/reviews
 * List all reviews (paginated). Query params: ?page=1&limit=20&status=active
 */
router.get(
  "/reviews",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const status = req.query.status || null;
    const offset = (page - 1) * limit;

    try {
      let query = supabaseAdmin
        .from("reviews")
        .select("*, places!reviews_place_id_fkey(name, category)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error({ err: error }, "GET /reviews");
        return res.status(500).json({ error: error.message });
      }
      return res.json({ data, total: count, page, limit });
    } catch (err) {
      logger.error({ err }, "GET /reviews unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/admin/reviews/:id
 * Soft-delete a review (sets status to 'deleted_by_admin').
 */
router.delete(
  "/reviews/:id",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    const reviewId = req.params.id;
    try {
      const { data, error } = await supabaseAdmin
        .from("reviews")
        .update({
          status: "deleted_by_admin",
          deleted_at: new Date().toISOString(),
          deleted_by: req.clerkUserId,
        })
        .eq("id", reviewId)
        .select()
        .single();

      if (error) {
        logger.error({ err: error, reviewId }, "DELETE /reviews/:id");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, "delete_review", "review", reviewId, {
        new_status: "deleted_by_admin",
      });

      return res.json({ message: "Review deleted", review: data });
    } catch (err) {
      logger.error({ err }, "DELETE /reviews/:id unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * PATCH /api/admin/reviews/:id/flag
 * Flag a review for moderation.
 */
router.patch(
  "/reviews/:id/flag",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    const reviewId = req.params.id;
    try {
      const { data, error } = await supabaseAdmin
        .from("reviews")
        .update({ status: "flagged" })
        .eq("id", reviewId)
        .select()
        .single();

      if (error) {
        logger.error({ err: error, reviewId }, "PATCH /reviews/:id/flag");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, "flag_review", "review", reviewId, {
        new_status: "flagged",
      });

      return res.json({ message: "Review flagged", review: data });
    } catch (err) {
      logger.error({ err }, "PATCH /reviews/:id/flag unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT MANAGEMENT — PLACES CRUD (admin + superadmin)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/places
 * List all places (paginated, searchable).
 * Query params: ?page=1&limit=20&search=pizza&category=food
 */
router.get(
  "/places",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search || null;
    const category = req.query.category || null;
    const offset = (page - 1) * limit;

    try {
      let query = supabaseAdmin
        .from("places")
        .select("id, name, category, sub_type, rating, rating_count, verified, data_source, created_at, updated_at", { count: "exact" })
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      if (category) {
        query = query.eq("category", category);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error({ err: error }, "GET /places");
        return res.status(500).json({ error: error.message });
      }
      return res.json({ data, total: count, page, limit });
    } catch (err) {
      logger.error({ err }, "GET /places unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * PATCH /api/admin/places/:id
 * Edit place fields (name, category, sub_type, phone, timing, amenities, verified, etc.).
 */
router.patch(
  "/places/:id",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    const placeId = req.params.id;
    const allowedFields = [
      "name", "category", "sub_type", "phone", "website", "timing",
      "amenities", "cuisine_tags", "verified", "address",
      "display_price_label", "price_inr", "noise_level", "crowd_level",
    ];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("places")
        .update(updates)
        .eq("id", placeId)
        .select()
        .single();

      if (error) {
        logger.error({ err: error, placeId }, "PATCH /places/:id");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, "edit_place", "place", placeId, {
        updated_fields: Object.keys(updates),
      });

      return res.json({ message: "Place updated", place: data });
    } catch (err) {
      logger.error({ err }, "PATCH /places/:id unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/admin/places/:id
 * Delete a place record.
 */
router.delete(
  "/places/:id",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    const placeId = req.params.id;
    try {
      const { error } = await supabaseAdmin
        .from("places")
        .delete()
        .eq("id", placeId);

      if (error) {
        logger.error({ err: error, placeId }, "DELETE /places/:id");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, "delete_place", "place", placeId, {});

      return res.json({ message: "Place deleted" });
    } catch (err) {
      logger.error({ err }, "DELETE /places/:id unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION HOOK: call after merchant submits ad (optional integration)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/notify-new-ad
 * Called by the merchant dashboard (or a Supabase webhook) when a new ad is created.
 * Body: { adId, adTitle }
 */
router.post(
  "/notify-new-ad",
  verifyClerkToken(), // any authenticated user (merchant)
  async (req, res) => {
    const { adId, adTitle } = req.body || {};
    try {
      await notifyAdmins(
        `New ad pending review: "${adTitle || "Untitled"}" (ID: ${adId})`,
        { adId, adTitle, submittedBy: req.clerkUserId }
      );
      return res.json({ message: "Notification sent" });
    } catch (err) {
      logger.error({ err }, "POST /notify-new-ad");
      // Non-blocking: don't fail the request if notification fails
      return res.json({ message: "Notification attempted (may have failed)" });
    }
  }
);

export default router;
