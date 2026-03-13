// server/communityRoutes.js
// Express router for community chat messages.
// Only verified Christ University students can post. Everyone signed in can read.

import { Router } from "express";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifyClerkToken } from "./middleware/verifyClerkToken.js";
import { isStudentEmail } from "./middleware/verifyStudent.js";
import logger from "./lib/logger.js";
import { z } from "zod";

const router = Router();

const messageSchema = z.object({
  message: z.string().min(1).max(500),
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/community/messages — Fetch recent community messages (auth required)
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/community/messages", verifyClerkToken(), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before; // cursor-based pagination

    let query = supabaseAdmin
      .from("community_messages")
      .select("id, clerk_user_id, message, created_at")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ err: error }, "GET /community/messages query error");
      return res.status(500).json({ error: "Failed to fetch messages" });
    }

    // Fetch user info for each unique clerk_user_id
    const userIds = [...new Set((data || []).map((m) => m.clerk_user_id))];
    let userMap = {};

    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("app_users")
        .select("clerk_user_id, full_name, email")
        .in("clerk_user_id", userIds);

      if (users) {
        for (const u of users) {
          userMap[u.clerk_user_id] = {
            name: u.full_name || u.email?.split("@")[0] || "Anonymous",
            email: u.email,
          };
        }
      }
    }

    const messages = (data || []).map((m) => ({
      id: m.id,
      message: m.message,
      created_at: m.created_at,
      user: userMap[m.clerk_user_id] || { name: "Unknown", email: null },
    }));

    return res.json({ data: messages });
  } catch (err) {
    logger.error({ err }, "GET /community/messages unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/community/messages — Send a community message (student only)
// ═══════════════════════════════════════════════════════════════════════════════

router.post("/community/messages", verifyClerkToken(), async (req, res) => {
  try {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid message",
        details: parsed.error.flatten(),
      });
    }

    const clerkUserId = req.clerkUserId;

    // Look up user to check student email
    const { data: user } = await supabaseAdmin
      .from("app_users")
      .select("email, role")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Merchants can read but not write
    if (user.role === "merchant") {
      return res.status(403).json({
        error: "Merchant accounts cannot post in community chat. Only students can participate.",
      });
    }

    // Must be verified student (admin/superadmin can also post)
    const isAdmin = user.role === "admin" || user.role === "superadmin";
    if (!isAdmin && !isStudentEmail(user.email)) {
      return res.status(403).json({
        error: "Only verified Christ University students can post in community chat. Sign in with your university email.",
      });
    }

    const { data: msg, error } = await supabaseAdmin
      .from("community_messages")
      .insert({
        clerk_user_id: clerkUserId,
        message: parsed.data.message,
      })
      .select("id, message, created_at")
      .single();

    if (error) {
      logger.error({ err: error }, "POST /community/messages insert error");
      return res.status(500).json({ error: "Failed to send message" });
    }

    logger.info(
      { user: clerkUserId, message_id: msg.id },
      "Community message sent"
    );

    return res.status(201).json({
      data: {
        id: msg.id,
        message: msg.message,
        created_at: msg.created_at,
        user: {
          name: user.email?.split("@")[0] || "Student",
          email: user.email,
        },
      },
    });
  } catch (err) {
    logger.error({ err }, "POST /community/messages unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/community/messages/:id — Delete a message (admin/superadmin only)
// ═══════════════════════════════════════════════════════════════════════════════

router.delete(
  "/community/messages/:id",
  verifyClerkToken(["admin", "superadmin"]),
  async (req, res) => {
    try {
      const messageId = req.params.id;
      const clerkUserId = req.clerkUserId;

      const { error } = await supabaseAdmin
        .from("community_messages")
        .update({ is_deleted: true, deleted_by: clerkUserId })
        .eq("id", messageId);

      if (error) {
        logger.error({ err: error }, "DELETE /community/messages/:id error");
        return res.status(500).json({ error: "Failed to delete message" });
      }

      logger.info(
        { admin: clerkUserId, message_id: messageId },
        "Community message deleted by admin"
      );

      return res.json({ success: true });
    } catch (err) {
      logger.error({ err }, "DELETE /community/messages/:id unexpected error");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
