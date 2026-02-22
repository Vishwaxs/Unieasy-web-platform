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
