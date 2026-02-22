// server/merchantRoutes.js
// Express router for merchant-facing endpoints.
// Protected by Clerk token verification.

import { Router } from "express";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifyClerkToken } from "./middleware/verifyClerkToken.js";

const router = Router();

/**
 * POST /api/merchant/upgrade
 * Upgrades the current authenticated user's role to "merchant".
 * Only students can self-upgrade. Already-merchant users get a success message.
 * Admins/superadmins cannot downgrade themselves this way.
 */
router.post(
  "/upgrade",
  verifyClerkToken(), // any authenticated user
  async (req, res) => {
    const clerkUserId = req.clerkUserId;
    const currentRole = req.userRole;

    // Already a merchant
    if (currentRole === "merchant") {
      return res.json({ message: "Already a merchant", role: "merchant" });
    }

    // Only students can self-promote to merchant
    if (currentRole !== "student") {
      return res.status(400).json({
        error: `Cannot upgrade from role "${currentRole}" to merchant. Only students can self-upgrade.`,
      });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("app_users")
        .update({ role: "merchant" })
        .eq("clerk_user_id", clerkUserId)
        .select("role")
        .single();

      if (error) {
        console.error("[POST /merchant/upgrade]", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.json({ message: "Upgraded to merchant", role: data.role });
    } catch (err) {
      console.error("[POST /merchant/upgrade] Unexpected:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
