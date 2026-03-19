// server/notificationRoutes.js
// REST API for in-app notifications (consumed by the frontend bell).

import { Router } from "express";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifyClerkToken } from "./middleware/verifyClerkToken.js";
import logger from "./lib/logger.js";

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/notifications
// Returns the current user's notifications (newest first, limit 20).
// Query: ?unread_only=true  — filter to unread only
// ═══════════════════════════════════════════════════════════════════════════════

router.get(
  "/notifications",
  verifyClerkToken(),
  async (req, res) => {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const unreadOnly = req.query.unread_only === "true";

    try {
      let query = supabaseAdmin
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("clerk_user_id", req.clerkUserId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq("is_read", false);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error({ err: error }, "GET /notifications");
        return res.status(500).json({ error: error.message });
      }

      // Also fetch total unread count (always useful for the badge)
      const { count: unreadCount } = await supabaseAdmin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("clerk_user_id", req.clerkUserId)
        .eq("is_read", false);

      return res.json({ data: data || [], total: count || 0, unread: unreadCount || 0 });
    } catch (err) {
      logger.error({ err }, "GET /notifications unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/notifications/:id/read
// Mark a single notification as read.
// ═══════════════════════════════════════════════════════════════════════════════

router.patch(
  "/notifications/:id/read",
  verifyClerkToken(),
  async (req, res) => {
    const notifId = req.params.id;

    try {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notifId)
        .eq("clerk_user_id", req.clerkUserId); // ensure ownership

      if (error) {
        logger.error({ err: error, notifId }, "PATCH /notifications/:id/read");
        return res.status(500).json({ error: error.message });
      }

      return res.json({ message: "Notification marked as read" });
    } catch (err) {
      logger.error({ err }, "PATCH /notifications/:id/read unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/notifications/read-all
// Mark all notifications as read for the current user.
// ═══════════════════════════════════════════════════════════════════════════════

router.patch(
  "/notifications/read-all",
  verifyClerkToken(),
  async (req, res) => {
    try {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .eq("clerk_user_id", req.clerkUserId)
        .eq("is_read", false);

      if (error) {
        logger.error({ err: error }, "PATCH /notifications/read-all");
        return res.status(500).json({ error: error.message });
      }

      return res.json({ message: "All notifications marked as read" });
    } catch (err) {
      logger.error({ err }, "PATCH /notifications/read-all unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
