// server/merchantRoutes.js
// Express router for merchant-facing endpoints.
// Protected by Clerk token verification.

import { Router } from "express";
import multer from "multer";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifyClerkToken } from "./middleware/verifyClerkToken.js";
import logger from "./lib/logger.js";

const router = Router();

// ── Multer config — 5 MB max, images only, stored in memory ─────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MERCHANT UPGRADE REQUEST (admin-verified flow)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/merchant/upgrade-request/status
 * Returns the most recent upgrade request status for the current user.
 */
router.get(
  "/upgrade-request/status",
  verifyClerkToken(),
  async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("merchant_upgrade_requests")
        .select("status, review_note")
        .eq("clerk_user_id", req.clerkUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error({ err: error }, "GET /merchant/upgrade-request/status");
        return res.status(500).json({ error: error.message });
      }

      if (!data) {
        return res.json({ status: null });
      }

      return res.json({ status: data.status, review_note: data.review_note });
    } catch (err) {
      logger.error({ err }, "GET /merchant/upgrade-request/status unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/merchant/upgrade-request
 * Submits a new merchant upgrade request for admin review.
 * Body: { businessName, businessType, contactNumber?, description? }
 */
router.post(
  "/upgrade-request",
  verifyClerkToken(),
  async (req, res) => {
    const { businessName, businessType, contactNumber, description } = req.body || {};

    if (!businessName || typeof businessName !== "string" || !businessName.trim()) {
      return res.status(400).json({ error: "businessName is required" });
    }
    if (!businessType || typeof businessType !== "string" || !businessType.trim()) {
      return res.status(400).json({ error: "businessType is required" });
    }

    // Check for existing pending request
    try {
      const { data: existing } = await supabaseAdmin
        .from("merchant_upgrade_requests")
        .select("id, status")
        .eq("clerk_user_id", req.clerkUserId)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: "You already have a pending request" });
      }

      const { data, error } = await supabaseAdmin
        .from("merchant_upgrade_requests")
        .insert({
          clerk_user_id: req.clerkUserId,
          business_name: businessName.trim(),
          business_type: businessType.trim(),
          contact_number: contactNumber?.trim() || null,
          description: description?.trim() || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        logger.error({ err: error }, "POST /merchant/upgrade-request insert failed");
        return res.status(500).json({ error: error.message });
      }

      logger.info({ requestId: data.id, clerkUserId: req.clerkUserId }, "Merchant upgrade request submitted");
      return res.status(201).json(data);
    } catch (err) {
      logger.error({ err }, "POST /merchant/upgrade-request unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// MERCHANT UPGRADE (legacy — direct upgrade, kept for backward compat)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/merchant/upgrade
 * Upgrades the current authenticated user's role to "merchant".
 * Only students can self-upgrade. Already-merchant users get a success message.
 */
router.post(
  "/upgrade",
  verifyClerkToken(), // any authenticated user
  async (req, res) => {
    const clerkUserId = req.clerkUserId;
    const currentRole = req.userRole;

    if (currentRole === "merchant") {
      return res.json({ message: "Already a merchant", role: "merchant" });
    }

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
        logger.error({ err: error }, "POST /merchant/upgrade failed");
        return res.status(500).json({ error: error.message });
      }

      logger.info({ clerkUserId }, "User upgraded to merchant");
      return res.json({ message: "Upgraded to merchant", role: data.role });
    } catch (err) {
      logger.error({ err }, "POST /merchant/upgrade unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// AD IMAGE UPLOAD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/merchant/ads/upload
 * Accepts a single image file (field name: "image"), uploads it to
 * Supabase Storage bucket "ads-images", and returns the public URL.
 */
router.post(
  "/ads/upload",
  verifyClerkToken(["merchant"]),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const ext = req.file.originalname.split(".").pop() || "jpg";
      const filePath = `ads/${req.clerkUserId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("ads-images")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        logger.error({ err: uploadError }, "Supabase storage upload failed");
        return res.status(500).json({ error: uploadError.message });
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("ads-images")
        .getPublicUrl(filePath);

      logger.info({ filePath }, "Ad image uploaded");
      return res.json({ imageUrl: urlData.publicUrl });
    } catch (err) {
      logger.error({ err }, "POST /merchant/ads/upload unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// AD CREATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/merchant/ads
 * Creates a new ad record with status 'pending'.
 * Body: { title, description?, imageUrl, targetLocation, durationDays }
 */
router.post(
  "/ads",
  verifyClerkToken(["merchant"]),
  async (req, res) => {
    const { title, description, imageUrl, targetLocation, durationDays } = req.body || {};

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).json({ error: "imageUrl is required (upload first)" });
    }

    const duration = Number(durationDays);
    if (![7, 14, 30].includes(duration)) {
      return res.status(400).json({ error: "durationDays must be 7, 14, or 30" });
    }

    try {
      const { data, error } = await supabaseAdmin.from("ads").insert({
        clerk_user_id: req.clerkUserId,
        title: title.trim(),
        description: description?.trim() || null,
        image_url: imageUrl,
        target_location: targetLocation?.trim() || null,
        duration_days: duration,
        status: "pending",
      }).select().single();

      if (error) {
        logger.error({ err: error }, "POST /merchant/ads insert failed");
        return res.status(500).json({ error: error.message });
      }

      logger.info({ adId: data.id, clerkUserId: req.clerkUserId }, "Ad created (pending)");
      return res.status(201).json(data);
    } catch (err) {
      logger.error({ err }, "POST /merchant/ads unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// MERCHANT'S OWN ADS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/merchant/ads
 * Returns all ads belonging to the authenticated merchant, newest first.
 */
router.get(
  "/ads",
  verifyClerkToken(["merchant"]),
  async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("ads")
        .select("*")
        .eq("clerk_user_id", req.clerkUserId)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error({ err: error }, "GET /merchant/ads failed");
        return res.status(500).json({ error: error.message });
      }

      return res.json(data);
    } catch (err) {
      logger.error({ err }, "GET /merchant/ads unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
