import { describe, it, expect } from "vitest";
import { getMapEmbedUrl, getMapsLink, GOOGLE_MAPS_EMBED_KEY } from "@/lib/maps";

describe("maps helpers", () => {
  it("returns null from getMapEmbedUrl when no embed key is configured", () => {
    // No VITE_GOOGLE_MAPS_EMBED_KEY is set in the test env.
    expect(GOOGLE_MAPS_EMBED_KEY).toBe("");
    expect(getMapEmbedUrl(12.9716, 77.5946)).toBeNull();
  });

  it("builds a keyless Google Maps link for a coordinate", () => {
    expect(getMapsLink(12.9716, 77.5946)).toBe(
      "https://www.google.com/maps/search/?api=1&query=12.9716,77.5946",
    );
  });
});
