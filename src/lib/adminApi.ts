/**
 * Shared helpers for authenticated calls to the Express API.
 * Used by AdminDashboard, SuperAdminDashboard, MerchantDashboard, etc.
 */

type GetToken = () => Promise<string | null>;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ─── Low-level helpers ──────────────────────────────────────────────────────

async function authenticatedFetch(
  getToken: GetToken,
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Makes an authenticated JSON fetch to `/api/admin{path}`.
 */
export async function adminFetch(
  getToken: GetToken,
  path: string,
  options: RequestInit = {}
): Promise<any> {
  return authenticatedFetch(getToken, `${API_BASE}/api/admin${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
}

/**
 * Makes an authenticated JSON fetch to `/api/superadmin{path}`.
 */
export async function superadminFetch(
  getToken: GetToken,
  path: string,
  options: RequestInit = {}
): Promise<any> {
  return authenticatedFetch(getToken, `${API_BASE}/api/superadmin${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
}

/**
 * Makes an authenticated JSON fetch to `/api{path}`.
 */
export async function apiFetch(
  getToken: GetToken,
  path: string,
  options: RequestInit = {}
): Promise<any> {
  return authenticatedFetch(getToken, `${API_BASE}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
}

// ─── Named helpers — Merchant ───────────────────────────────────────────────

/** Upgrade current user to merchant role. */
export function requestMerchant(getToken: GetToken) {
  return apiFetch(getToken, "/merchant/upgrade", { method: "POST" });
}

/** Upload an ad image (multipart). Returns `{ imageUrl }`. */
export async function uploadAdImage(
  getToken: GetToken,
  file: File
): Promise<{ imageUrl: string }> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${API_BASE}/api/merchant/ads/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Create a new ad (status = pending). Returns the inserted row. */
export function createAd(
  getToken: GetToken,
  payload: {
    title: string;
    description?: string;
    imageUrl: string;
    targetLocation?: string;
    linkUrl?: string;
    buttonText?: string;
    categoryTarget?: string;
    durationDays: number;
  }
) {
  return apiFetch(getToken, "/merchant/ads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Fetch the current merchant's own ads. */
export function fetchMyAds(getToken: GetToken) {
  return apiFetch(getToken, "/merchant/ads");
}

/** Submit a merchant upgrade request (student -> merchant). */
export function requestMerchantUpgrade(
  getToken: GetToken,
  payload: {
    business_name: string;
    business_type: string;
    contact_number: string;
    description: string;
    website?: string;
  },
) {
  return apiFetch(getToken, "/merchant/request-upgrade", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Fetch the current user's merchant upgrade request status. */
export function fetchMerchantUpgradeStatus(getToken: GetToken) {
  return apiFetch(getToken, "/merchant/request-upgrade/status");
}

/** Delete an ad (pending only). */
export function deleteMyAd(getToken: GetToken, adId: string) {
  return apiFetch(getToken, `/merchant/ads/${adId}`, { method: "DELETE" });
}

// ─── Named helpers — Admin ──────────────────────────────────────────────────

/** Approve an ad by ID. */
export function approveAd(getToken: GetToken, adId: string) {
  return adminFetch(getToken, `/ads/${adId}/approve`, { method: "POST" });
}

/** Reject an ad by ID with optional reason. */
export function rejectAd(getToken: GetToken, adId: string, reason = "") {
  return adminFetch(getToken, `/ads/${adId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// ─── Named helpers — Campus Places CRUD ─────────────────────────────────────

export interface CampusPlacePayload {
  name: string;
  sub_type?: string;
  type?: string;
  address?: string;
  lat?: number;
  lng?: number;
  timing?: string;
  crowd_level?: string;
  phone?: string;
  website?: string;
  amenities?: string[];
  cuisine_tags?: string[];
  price_range_min?: number;
  price_range_max?: number;
  display_price_label?: string;
  has_wifi?: boolean;
  noise_level?: string;
  is_veg?: boolean;
  distance_from_campus?: string;
  business_status?: string;
  is_open_now?: boolean;
}

/** List all campus places (admin). */
export function fetchAdminCampusPlaces(getToken: GetToken) {
  return adminFetch(getToken, "/campus");
}

/** Create a new campus place. */
export function createCampusPlace(getToken: GetToken, payload: CampusPlacePayload) {
  return adminFetch(getToken, "/campus", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Update an existing campus place (partial). */
export function updateCampusPlace(getToken: GetToken, id: string, payload: Partial<CampusPlacePayload>) {
  return adminFetch(getToken, `/campus/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Delete a campus place. */
export function deleteCampusPlace(getToken: GetToken, id: string) {
  return adminFetch(getToken, `/campus/${id}`, { method: "DELETE" });
}

// ─── Named helpers — Notifications ──────────────────────────────────────────

/** Fetch current user's notifications. Returns { data, total, unread }. */
export function fetchNotifications(getToken: GetToken, limit = 20, unreadOnly = false) {
  return apiFetch(getToken, `/notifications?limit=${limit}&unread_only=${unreadOnly}`);
}

/** Mark a single notification as read. */
export function markNotificationRead(getToken: GetToken, notifId: string) {
  return apiFetch(getToken, `/notifications/${notifId}/read`, { method: "PATCH" });
}

/** Mark all notifications as read. */
export function markAllNotificationsRead(getToken: GetToken) {
  return apiFetch(getToken, `/notifications/read-all`, { method: "PATCH" });
}
