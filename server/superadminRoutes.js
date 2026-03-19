// server/superadminRoutes.js
// Express router for superadmin-only endpoints.
// All routes require verifyClerkToken(['superadmin']).

import { Router } from "express";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifyClerkToken } from "./middleware/verifyClerkToken.js";
import logger from "./lib/logger.js";

const router = Router();

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
// STATS & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/superadmin/stats
 * Returns the superadmin_stats view with all platform metrics.
 */
router.get(
  "/stats",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    try {
      // Always use direct aggregation for fresh, accurate stats
      const [usersRes, placesRes, reviewsRes, adsRes] = await Promise.all([
        supabaseAdmin.from("app_users").select("role, is_suspended, created_at"),
        supabaseAdmin.from("places").select("id"),
        supabaseAdmin.from("reviews").select("id, created_at"),
        supabaseAdmin.from("ads").select("status"),
      ]);

      const users = usersRes.data || [];
      const places = placesRes.data || [];
      const reviews = reviewsRes.data || [];
      const ads = adsRes.data || [];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const stats = {
        total_users: users.length,
        students: users.filter(u => u.role === "student").length,
        merchants: users.filter(u => u.role === "merchant").length,
        admins: users.filter(u => u.role === "admin").length,
        superadmins: users.filter(u => u.role === "superadmin").length,
        suspended_users: users.filter(u => u.is_suspended).length,
        total_places: places.length,
        total_reviews: reviews.length,
        pending_ads: ads.filter(a => a.status === "pending").length,
        active_ads: ads.filter(a => a.status === "active").length,
        new_users_7d: users.filter(u => new Date(u.created_at) >= sevenDaysAgo).length,
        new_reviews_7d: reviews.filter(r => new Date(r.created_at) >= sevenDaysAgo).length,
      };

      return res.json(stats);
    } catch (err) {
      logger.error({ err }, "GET /stats unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/superadmin/growth?days=30
 * Returns user registrations per day for the specified period.
 */
router.get(
  "/growth",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 30));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    try {
      const { data, error } = await supabaseAdmin
        .from("app_users")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        logger.error({ err: error }, "GET /growth");
        return res.status(500).json({ error: error.message });
      }

      // Group by date
      const grouped = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const key = d.toISOString().split("T")[0];
        grouped[key] = 0;
      }

      (data || []).forEach(user => {
        const key = user.created_at.split("T")[0];
        if (grouped[key] !== undefined) {
          grouped[key]++;
        }
      });

      const result = Object.entries(grouped).map(([date, count]) => ({ date, count }));
      return res.json(result);
    } catch (err) {
      logger.error({ err }, "GET /growth unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/superadmin/admins
 * List all users with role='admin', with their action counts.
 */
router.get(
  "/admins",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    try {
      // Get all admins
      const { data: admins, error: adminsErr } = await supabaseAdmin
        .from("app_users")
        .select("id, clerk_user_id, email, full_name, role, created_at, role_updated_at, last_active_at")
        .eq("role", "admin")
        .order("role_updated_at", { ascending: false });

      if (adminsErr) {
        logger.error({ err: adminsErr }, "GET /admins");
        return res.status(500).json({ error: adminsErr.message });
      }

      // Get action counts for each admin
      const adminIds = (admins || []).map(a => a.clerk_user_id);

      if (adminIds.length === 0) {
        return res.json([]);
      }

      const { data: logs, error: logsErr } = await supabaseAdmin
        .from("audit_logs")
        .select("actor_id")
        .in("actor_id", adminIds);

      if (logsErr) {
        logger.warn({ err: logsErr }, "Failed to fetch audit logs for admins");
      }

      // Count actions per admin
      const actionCounts = {};
      (logs || []).forEach(log => {
        actionCounts[log.actor_id] = (actionCounts[log.actor_id] || 0) + 1;
      });

      const result = (admins || []).map(admin => ({
        ...admin,
        actions_count: actionCounts[admin.clerk_user_id] || 0,
      }));

      return res.json(result);
    } catch (err) {
      logger.error({ err }, "GET /admins unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/superadmin/set-admin
 * Promote a user to admin role.
 * Body: { clerkUserId: string }
 */
router.post(
  "/set-admin",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    const { clerkUserId } = req.body || {};

    if (!clerkUserId || typeof clerkUserId !== "string") {
      return res.status(400).json({ error: "Missing or invalid clerkUserId" });
    }

    // Prevent self-promotion (already superadmin)
    if (clerkUserId === req.clerkUserId) {
      return res.status(400).json({ error: "Cannot change your own role" });
    }

    try {
      // Get current role
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("app_users")
        .select("role, email, full_name")
        .eq("clerk_user_id", clerkUserId)
        .single();

      if (fetchErr || !existing) {
        return res.status(404).json({ error: "User not found" });
      }

      if (existing.role === "admin" || existing.role === "superadmin") {
        return res.status(400).json({ error: "User is already an admin" });
      }

      const oldRole = existing.role;

      // Update role
      const { data, error } = await supabaseAdmin
        .from("app_users")
        .update({ role: "admin", role_updated_at: new Date().toISOString() })
        .eq("clerk_user_id", clerkUserId)
        .select()
        .single();

      if (error) {
        logger.error({ err: error }, "POST /set-admin");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, "promote_to_admin", "user", clerkUserId, {
        old_role: oldRole,
        new_role: "admin",
        user_email: existing.email,
      });

      return res.json({ message: "User promoted to admin", user: data });
    } catch (err) {
      logger.error({ err }, "POST /set-admin unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/superadmin/demote-admin
 * Demote an admin back to student role.
 * Body: { clerkUserId: string }
 */
router.post(
  "/demote-admin",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    const { clerkUserId } = req.body || {};

    if (!clerkUserId || typeof clerkUserId !== "string") {
      return res.status(400).json({ error: "Missing or invalid clerkUserId" });
    }

    if (clerkUserId === req.clerkUserId) {
      return res.status(400).json({ error: "Cannot demote yourself" });
    }

    try {
      // Get current role
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("app_users")
        .select("role, email, full_name")
        .eq("clerk_user_id", clerkUserId)
        .single();

      if (fetchErr || !existing) {
        return res.status(404).json({ error: "User not found" });
      }

      if (existing.role === "superadmin") {
        return res.status(403).json({ error: "Cannot demote a superadmin" });
      }

      if (existing.role !== "admin") {
        return res.status(400).json({ error: "User is not an admin" });
      }

      // Update role
      const { data, error } = await supabaseAdmin
        .from("app_users")
        .update({ role: "student", role_updated_at: new Date().toISOString() })
        .eq("clerk_user_id", clerkUserId)
        .select()
        .single();

      if (error) {
        logger.error({ err: error }, "POST /demote-admin");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, "demote_from_admin", "user", clerkUserId, {
        old_role: "admin",
        new_role: "student",
        user_email: existing.email,
      });

      return res.json({ message: "Admin demoted to student", user: data });
    } catch (err) {
      logger.error({ err }, "POST /demote-admin unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/superadmin/search-users
 * Search users by email for admin promotion.
 * Body: { email: string }
 */
router.post(
  "/search-users",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    const { email } = req.body || {};

    if (!email || typeof email !== "string" || email.length < 3) {
      return res.status(400).json({ error: "Email search term too short" });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("app_users")
        .select("id, clerk_user_id, email, full_name, role")
        .ilike("email", `%${email}%`)
        .limit(10);

      if (error) {
        logger.error({ err: error }, "POST /search-users");
        return res.status(500).json({ error: error.message });
      }

      return res.json(data || []);
    } catch (err) {
      logger.error({ err }, "POST /search-users unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// FULL AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/superadmin/audit-logs
 * Returns full unfiltered audit logs with pagination.
 * Query params: ?page=1&limit=20&role=admin&action=approve_ad
 */
router.get(
  "/audit-logs",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const roleFilter = req.query.role || null;
    const actionFilter = req.query.action || null;

    try {
      let query = supabaseAdmin
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (roleFilter) {
        query = query.eq("actor_role", roleFilter);
      }
      if (actionFilter) {
        query = query.eq("action", actionFilter);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error({ err: error }, "GET /audit-logs");
        return res.status(500).json({ error: error.message });
      }

      return res.json({ data, total: count, page, limit });
    } catch (err) {
      logger.error({ err }, "GET /audit-logs unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// PLACES MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/superadmin/places
 * List all places with pagination and search.
 * Query params: ?page=1&limit=20&search=coffee
 */
router.get(
  "/places",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || null;

    try {
      let query = supabaseAdmin
        .from("places")
        .select("id, google_place_id, name, category, address, is_featured, featured_order, verified, created_at, updated_at", { count: "exact" })
        .order("is_featured", { ascending: false })
        .order("name", { ascending: true })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.ilike("name", `%${search}%`);
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
 * POST /api/superadmin/places/:id/feature
 * Toggle featured status for a place.
 * Body: { is_featured: boolean, featured_order?: number }
 */
router.post(
  "/places/:id/feature",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    const placeId = req.params.id;
    const { is_featured, featured_order } = req.body || {};

    if (typeof is_featured !== "boolean") {
      return res.status(400).json({ error: "is_featured must be a boolean" });
    }

    try {
      const updateData = {
        is_featured,
        featured_order: is_featured ? (featured_order || 0) : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from("places")
        .update(updateData)
        .eq("id", placeId)
        .select()
        .single();

      if (error) {
        logger.error({ err: error, placeId }, "POST /places/:id/feature");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, is_featured ? "feature_place" : "unfeature_place", "place", placeId, {
        is_featured,
        featured_order,
      });

      return res.json({ message: is_featured ? "Place featured" : "Place unfeatured", place: data });
    } catch (err) {
      logger.error({ err }, "POST /places/:id/feature unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/superadmin/places/:id/verify
 * Toggle verified status for a place.
 * Body: { verified: boolean }
 */
router.post(
  "/places/:id/verify",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    const placeId = req.params.id;
    const { verified } = req.body || {};

    if (typeof verified !== "boolean") {
      return res.status(400).json({ error: "verified must be a boolean" });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("places")
        .update({ verified, updated_at: new Date().toISOString() })
        .eq("id", placeId)
        .select()
        .single();

      if (error) {
        logger.error({ err: error, placeId }, "POST /places/:id/verify");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, verified ? "verify_place" : "unverify_place", "place", placeId, {
        verified,
      });

      return res.json({ message: verified ? "Place verified" : "Place unverified", place: data });
    } catch (err) {
      logger.error({ err }, "POST /places/:id/verify unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/superadmin/places/:id/refresh
 * Refresh place data from Google Places API.
 */
router.post(
  "/places/:id/refresh",
  verifyClerkToken(["superadmin"]),
  async (req, res) => {
    const placeId = req.params.id;

    try {
      // Get the place to find its Google Place ID
      const { data: place, error: fetchErr } = await supabaseAdmin
        .from("places")
        .select("google_place_id, name")
        .eq("id", placeId)
        .single();

      if (fetchErr || !place) {
        return res.status(404).json({ error: "Place not found" });
      }

      if (!place.google_place_id) {
        return res.status(400).json({ error: "Place has no Google Place ID" });
      }

      // Fetch from Google Places API
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      const fields = "name,formatted_address,formatted_phone_number,opening_hours,rating,user_ratings_total,photos,website,price_level";
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.google_place_id}&fields=${fields}&key=${apiKey}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.status !== "OK") {
        logger.warn({ placeId, status: result.status }, "Google Places API error");
        return res.status(400).json({ error: `Google API error: ${result.status}` });
      }

      const details = result.result;
      const updateData = {
        name: details.name || place.name,
        address: details.formatted_address || null,
        phone: details.formatted_phone_number || null,
        website: details.website || null,
        google_rating: details.rating || null,
        google_reviews_count: details.user_ratings_total || null,
        price_level: details.price_level || null,
        updated_at: new Date().toISOString(),
      };

      // Parse opening hours
      if (details.opening_hours?.weekday_text) {
        updateData.opening_hours = details.opening_hours.weekday_text;
      }

      const { data, error } = await supabaseAdmin
        .from("places")
        .update(updateData)
        .eq("id", placeId)
        .select()
        .single();

      if (error) {
        logger.error({ err: error, placeId }, "POST /places/:id/refresh update");
        return res.status(500).json({ error: error.message });
      }

      await auditLog(req.clerkUserId, req.userRole, "refresh_place", "place", placeId, {
        google_place_id: place.google_place_id,
      });

      return res.json({ message: "Place refreshed from Google", place: data });
    } catch (err) {
      logger.error({ err }, "POST /places/:id/refresh unexpected");
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
