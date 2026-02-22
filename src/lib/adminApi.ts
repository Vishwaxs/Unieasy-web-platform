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
