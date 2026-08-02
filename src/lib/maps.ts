// Google Maps Embed helpers.
//
// The API key MUST come from the environment. Never hardcode it: the built
// frontend bundle is publicly served, so a committed key is an immediate leak
// (and trips the CI key-leak check). Configure `VITE_GOOGLE_MAPS_EMBED_KEY`
// in the deploy environment / `.env`.

export const GOOGLE_MAPS_EMBED_KEY: string =
  import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY ?? "";

/**
 * Builds a Google Maps Embed URL for a coordinate. Returns `null` when no API
 * key is configured so callers can render a fallback instead of a broken frame.
 */
export function getMapEmbedUrl(
  lat: number,
  lng: number,
  zoom = 16,
): string | null {
  if (!GOOGLE_MAPS_EMBED_KEY) return null;
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_EMBED_KEY,
    q: `${lat},${lng}`,
    zoom: String(zoom),
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

/**
 * Keyless external Google Maps link — a safe fallback that works without an
 * embed API key.
 */
export function getMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
