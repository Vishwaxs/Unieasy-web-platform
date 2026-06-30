/**
 * Google Maps Embed helpers.
 *
 * The embed key is read exclusively from the `VITE_GOOGLE_MAPS_EMBED_KEY`
 * environment variable. It must never be hard-coded: the frontend bundle is
 * publicly served, and CI fails the build if an API-key literal is detected in
 * `dist/`. When no key is configured, callers should fall back to a plain
 * Google Maps link instead of rendering an embed with an empty key.
 */
const EMBED_KEY = (import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY ?? "").trim();

/** Whether a Google Maps Embed API key is configured for this build. */
export function hasMapsEmbedKey(): boolean {
  return EMBED_KEY.length > 0;
}

/**
 * Build a Google Maps Embed `place` URL for the given coordinates.
 * Returns an empty string when no embed key is configured, so callers should
 * guard with {@link hasMapsEmbedKey} before rendering an iframe.
 */
export function getMapEmbedUrl(
  lat: number,
  lng: number,
  zoom = 16,
): string {
  if (!hasMapsEmbedKey()) return "";
  const params = new URLSearchParams({
    key: EMBED_KEY,
    q: `${lat},${lng}`,
    zoom: String(zoom),
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}
