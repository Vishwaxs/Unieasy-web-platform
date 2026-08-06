/**
 * Shared helpers for the category "places" hooks (food, accommodation, study,
 * essentials, explore). These were previously copy-pasted byte-for-byte into
 * each hook; centralising them keeps the API base URL and photo-URL logic in a
 * single place so a change (e.g. a new photo route) only has to be made once.
 */

/** Base URL for the places API. Empty string means same-origin. */
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Resolve the display image for a place.
 *
 * When the place has at least one Google photo reference we proxy the first one
 * through our own API (`/api/places/:id/photo/0`) so the Google key stays on the
 * server; otherwise we fall back to the caller-supplied placeholder image.
 */
export function getPhotoUrl(
  place: Record<string, unknown>,
  fallback: string,
): string {
  const refs = Array.isArray(place.photo_refs) ? place.photo_refs : [];
  const placeId = typeof place.id === "string" ? place.id : null;
  if (!placeId || refs.length === 0) return fallback;
  return `${API_BASE}/api/places/${placeId}/photo/0`;
}
