// server/merchantRoutes.js
// Express router for merchant-facing endpoints.
// Protected by Clerk token verification.

import { Router } from "express";
import multer from "multer";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifyClerkToken } from "./middleware/verifyClerkToken.js";
import { notifyAdminEmails, insertAdminNotifications } from "./lib/emailService.js";
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
 * POST /api/merchant/request-upgrade
 * Also available at /api/merchant/upgrade-request (legacy alias).
 * Submits a new merchant upgrade request for admin review.
 * Body: { business_name, business_type, contact_number?, description?, website? }
 * OR:   { businessName, businessType, contactNumber?, description?, website? } (legacy)
 * Requires role='student'. Rejects if a pending request already exists.
 */
async function handleRequestUpgrade(req, res) {
  // Accept both snake_case and camelCase body fields
  const businessName = req.body?.business_name || req.body?.businessName;
  const businessType = req.body?.business_type || req.body?.businessType;
  const contactNumber = req.body?.contact_number || req.body?.contactNumber;
  const description = req.body?.description;
  const website = req.body?.website;

  if (!businessName || typeof businessName !== "string" || !businessName.trim()) {
    return res.status(400).json({ error: "business_name is required" });
  }
  if (!businessType || typeof businessType !== "string" || !businessType.trim()) {
    return res.status(400).json({ error: "business_type is required" });
  }

  // Already a merchant — no need to re-apply
  if (req.userRole === "merchant") {
    return res.status(400).json({ error: "You are already a merchant" });
  }

  try {
    // Check for existing pending request
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
      logger.error({ err: error }, "POST /merchant/request-upgrade insert failed");
      return res.status(500).json({ error: error.message });
    }

    logger.info({ requestId: data.id, clerkUserId: req.clerkUserId }, "Merchant upgrade request submitted");

    // ── Notify admins about the new request ───────────────────────────
    try {
      const { data: user } = await supabaseAdmin
        .from("app_users")
        .select("email, full_name")
        .eq("clerk_user_id", req.clerkUserId)
        .single();
      const userName = user?.full_name || "Unknown";
      const userEmail = user?.email || "";
      notifyAdminEmails("new_ad_submitted", {
        merchantName: userName,
        merchantEmail: userEmail,
        adTitle: `Merchant application: ${businessName.trim()}`,
      });
      insertAdminNotifications("merchant_upgrade_requested",
        `New merchant application from ${userName}`,
        `${userName} (${userEmail}) applied for "${businessName.trim()}"`,
        "/admin", { requestId: data.id });
    } catch (_) { /* non-blocking */ }

    return res.status(201).json({ message: "Request submitted", requestId: data.id, request: data });
  } catch (err) {
    logger.error({ err }, "POST /merchant/request-upgrade unexpected");
    return res.status(500).json({ error: "Internal server error" });
  }
}

router.post("/request-upgrade", verifyClerkToken(), handleRequestUpgrade);
router.post("/upgrade-request", verifyClerkToken(), handleRequestUpgrade); // legacy alias

// ═══════════════════════════════════════════════════════════════════════════════
// MERCHANT UPGRADE STATUS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/merchant/upgrade-status
 * Also available at /api/merchant/upgrade-request/status (legacy alias).
 * Returns the user's latest merchant_upgrade_requests row.
 * Response: { status: 'none'|'pending'|'approved'|'rejected', request: {...} | null }
 */
async function handleUpgradeStatus(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("merchant_upgrade_requests")
      .select("*")
      .eq("clerk_user_id", req.clerkUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error({ err: error }, "GET /merchant/upgrade-status");
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.json({ status: "none", request: null });
    }

    return res.json({ status: data.status, request: data, review_note: data.review_note });
  } catch (err) {
    logger.error({ err }, "GET /merchant/upgrade-status unexpected");
    return res.status(500).json({ error: "Internal server error" });
  }
}

router.get("/upgrade-status", verifyClerkToken(), handleUpgradeStatus);
router.get("/upgrade-request/status", verifyClerkToken(), handleUpgradeStatus); // legacy alias

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

      // ── Notify admins about new ad submission ─────────────────────────
      try {
        const { data: merchant } = await supabaseAdmin
          .from("app_users")
          .select("email, full_name")
          .eq("clerk_user_id", req.clerkUserId)
          .single();
        const merchantName = merchant?.full_name || "Unknown";
        const merchantEmail = merchant?.email || "";
        notifyAdminEmails("new_ad_submitted", {
          merchantName, merchantEmail, adTitle: title.trim(),
        });
        insertAdminNotifications("new_ad_submitted",
          `New ad from ${merchantName}`,
          `"${title.trim()}" is awaiting review.`,
          "/admin", { adId: data.id });
      } catch (_) { /* non-blocking */ }

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
 * Includes click_count & impression_count.
 */
router.get(
  "/ads",
  verifyClerkToken(["merchant"]),
  async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("ads")
        .select("id, title, description, image_url, target_location, duration_days, status, click_count, impression_count, created_at, approved_at, rejected_reason")
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

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE MERCHANT AD (soft-delete, pending only)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DELETE /api/merchant/ads/:id
 * Soft-delete an ad by setting status='deleted'.
 * Only allowed if the ad belongs to this merchant AND status='pending'.
 */
router.delete(
  "/ads/:id",
  verifyClerkToken(["merchant"]),
  async (req, res) => {
    const adId = req.params.id;

    try {
      // Verify ownership and status
      const { data: ad, error: fetchErr } = await supabaseAdmin
        .from("ads")
        .select("id, clerk_user_id, status")
        .eq("id", adId)
        .single();

      if (fetchErr || !ad) {
        return res.status(404).json({ error: "Ad not found" });
      }

      if (ad.clerk_user_id !== req.clerkUserId) {
        return res.status(403).json({ error: "You can only delete your own ads" });
      }

      if (ad.status !== "pending") {
        return res.status(400).json({ error: `Cannot delete ad with status '${ad.status}'. Only pending ads can be deleted.` });
      }

      const { error: updateErr } = await supabaseAdmin
        .from("ads")
        .update({ status: "deleted" })
        .eq("id", adId);

      if (updateErr) {
        logger.error({ err: updateErr, adId }, "DELETE /merchant/ads/:id");
        return res.status(500).json({ error: updateErr.message });
      }

      logger.info({ adId, clerkUserId: req.clerkUserId }, "Ad soft-deleted by merchant");
      return res.json({ message: "Ad deleted" });
    } catch (err) {
      logger.error({ err }, "DELETE /merchant/ads/:id unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// MERCHANT NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/merchant/notifications
 * Returns notifications for this user, newest first, limit 20.
 * Query: ?unread_only=true
 */
router.get(
  "/notifications",
  verifyClerkToken(["merchant"]),
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
        logger.error({ err: error }, "GET /merchant/notifications");
        return res.status(500).json({ error: error.message });
      }

      // Unread count for badge
      const { count: unreadCount } = await supabaseAdmin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("clerk_user_id", req.clerkUserId)
        .eq("is_read", false);

      return res.json({ data: data || [], total: count || 0, unread: unreadCount || 0 });
    } catch (err) {
      logger.error({ err }, "GET /merchant/notifications unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/merchant/notifications/mark-read
 * Mark notifications as read.
 * Body: { notification_ids: string[] } — marks specific IDs
 *   OR: { all: true }                  — marks all as read
 */
router.post(
  "/notifications/mark-read",
  verifyClerkToken(["merchant"]),
  async (req, res) => {
    const { notification_ids, all } = req.body || {};

    try {
      if (all === true) {
        const { error } = await supabaseAdmin
          .from("notifications")
          .update({ is_read: true })
          .eq("clerk_user_id", req.clerkUserId)
          .eq("is_read", false);

        if (error) {
          logger.error({ err: error }, "POST /merchant/notifications/mark-read (all)");
          return res.status(500).json({ error: error.message });
        }
        return res.json({ message: "All notifications marked as read" });
      }

      if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
        return res.status(400).json({ error: "Provide notification_ids array or { all: true }" });
      }

      // Cap batch size
      const ids = notification_ids.slice(0, 50);

      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids)
        .eq("clerk_user_id", req.clerkUserId); // ensure ownership

      if (error) {
        logger.error({ err: error }, "POST /merchant/notifications/mark-read");
        return res.status(500).json({ error: error.message });
      }

      return res.json({ message: `${ids.length} notification(s) marked as read` });
    } catch (err) {
      logger.error({ err }, "POST /merchant/notifications/mark-read unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// MERCHANT ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/merchant/analytics
 * Returns aggregated analytics for the merchant's associated places and ads.
 */
router.get(
  "/analytics",
  verifyClerkToken(["merchant"]),
  async (req, res) => {
    try {
      // Get ads stats
      const { data: ads, error: adsErr } = await supabaseAdmin
        .from("ads")
        .select("id, status, impression_count, click_count")
        .eq("clerk_user_id", req.clerkUserId);

      if (adsErr) {
        logger.error({ err: adsErr }, "GET /merchant/analytics ads");
        return res.status(500).json({ error: adsErr.message });
      }

      const totalAds = ads?.length || 0;
      const activeAds = ads?.filter(a => a.status === "active").length || 0;
      const totalImpressions = ads?.reduce((sum, a) => sum + (a.impression_count || 0), 0) || 0;
      const totalClicks = ads?.reduce((sum, a) => sum + (a.click_count || 0), 0) || 0;

      return res.json({
        ads: { total: totalAds, active: activeAds, impressions: totalImpressions, clicks: totalClicks },
      });
    } catch (err) {
      logger.error({ err }, "GET /merchant/analytics unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
