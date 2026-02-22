/**
 * Shared helper for authenticated calls to the Express admin API.
 * Used by AdminDashboard, SuperAdminDashboard, MerchantAuth, etc.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/**
 * Makes an authenticated fetch to `/api/admin{path}`.
 *
 * @param getToken - Clerk's `getToken()` function (from `useAuth()`)
 * @param path     - API path after `/api/admin`, e.g. `/ads/pending`
 * @param options  - Standard `RequestInit` overrides
 * @returns Parsed JSON response body
 * @throws Error with server message or HTTP status
 */
export async function adminFetch(
  getToken: () => Promise<string | null>,
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
 * Makes an authenticated fetch to `/api{path}` (non-admin routes).
 *
 * @param getToken - Clerk's `getToken()` function (from `useAuth()`)
 * @param path     - API path after `/api`, e.g. `/merchant/upgrade`
 * @param options  - Standard `RequestInit` overrides
 * @returns Parsed JSON response body
 */
export async function apiFetch(
  getToken: () => Promise<string | null>,
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
