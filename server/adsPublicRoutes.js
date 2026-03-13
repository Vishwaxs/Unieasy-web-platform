// server/adsPublicRoutes.js
// Public routes for fetching active ads and tracking impressions.

import { Router } from "express";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import logger from "./lib/logger.js";

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/ads/active — fetch active (approved) ads, no auth required
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/ads/active", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("ads")
      .select("id, title, description, image_url, target_location")
      .eq("status", "active")
      .order("approved_at", { ascending: false })
      .limit(10);

    if (error) {
      logger.error({ err: error }, "GET /ads/active failed");
      return res.status(500).json({ error: error.message });
    }

    return res.json({ data: data || [] });
  } catch (err) {
    logger.error({ err }, "GET /ads/active unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/ads/:id/impression — increment impression count, no auth required
// ═══════════════════════════════════════════════════════════════════════════════

router.patch("/ads/:id/impression", async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin.rpc("increment_impression", {
      ad_id: id,
    });

    // Fallback if the RPC function doesn't exist: manual increment
    if (error) {
      const { data: ad, error: fetchErr } = await supabaseAdmin
        .from("ads")
        .select("impression_count")
        .eq("id", id)
        .single();

      if (fetchErr || !ad) {
        return res.status(404).json({ error: "Ad not found" });
      }

      const { error: updateErr } = await supabaseAdmin
        .from("ads")
        .update({ impression_count: (ad.impression_count || 0) + 1 })
        .eq("id", id);

      if (updateErr) {
        logger.error({ err: updateErr }, "Impression update failed");
        return res.status(500).json({ error: updateErr.message });
      }
    }

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "PATCH /ads/:id/impression unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
