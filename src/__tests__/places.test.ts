import { describe, it, expect } from "vitest";
import { API_BASE, getPhotoUrl } from "@/lib/places";

const FALLBACK = "https://example.com/fallback.jpg";

describe("getPhotoUrl", () => {
  it("returns the fallback when the place has no photo refs", () => {
    expect(getPhotoUrl({ id: "abc" }, FALLBACK)).toBe(FALLBACK);
    expect(getPhotoUrl({ id: "abc", photo_refs: [] }, FALLBACK)).toBe(FALLBACK);
  });

  it("returns the fallback when the id is missing or not a string", () => {
    expect(getPhotoUrl({ photo_refs: ["ref"] }, FALLBACK)).toBe(FALLBACK);
    expect(getPhotoUrl({ id: 123, photo_refs: ["ref"] }, FALLBACK)).toBe(FALLBACK);
  });

  it("proxies the first photo through the places API when refs exist", () => {
    expect(getPhotoUrl({ id: "place-1", photo_refs: ["ref-a", "ref-b"] }, FALLBACK)).toBe(
      `${API_BASE}/api/places/place-1/photo/0`,
    );
  });

  it("ignores a non-array photo_refs value and returns the fallback", () => {
    expect(getPhotoUrl({ id: "abc", photo_refs: "not-an-array" }, FALLBACK)).toBe(FALLBACK);
  });
});
