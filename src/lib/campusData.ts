/**
 * Static fallback data for on-campus places.
 *
 * All image URLs are mock placeholders until real images are available.
 */

function mockImage(label: string): string {
  return `https://placehold.co/800x500?text=${encodeURIComponent(label)}`;
}

// Matched by lowercase place name.
export const CAMPUS_PLACE_IMAGES: Record<string, string> = {
  "cafe coffee day": mockImage("Cafe coffee day"),
  "4th block cafe": mockImage("4th block cafe"),
  "k e cafe": mockImage("K E cafe"),
  mingos: mockImage("Mingos"),
  kiosk: mockImage("Kiosk"),
  chapel: mockImage("Chapel"),
  nandini: mockImage("Nandini"),
  fresheteria: mockImage("Fresheteria"),
  stall: mockImage("Stall"),
  "just bake": mockImage("Just bake"),
  "punjabi bites": mockImage("Punjabi bites"),
  "michael's": mockImage("Michael's"),
  "eleven 11": mockImage("Eleven 11"),
  "christ bakery": mockImage("Christ Bakery"),
  "health center": mockImage("Health Center"),
  "stationery- nice service": mockImage("Stationery- Nice service"),
};

const CAMPUS_DEFAULT_IMAGE = mockImage("On-campus");

export function getCampusImage(name: string, _subType?: string | null): string {
  return CAMPUS_PLACE_IMAGES[name.toLowerCase().trim()] ?? CAMPUS_DEFAULT_IMAGE;
}

export interface MenuItem {
  name: string;
  price?: string;
}

export interface MenuSection {
  section: string;
  items: MenuItem[];
}

// No static menus for the new list yet.
export const CAMPUS_FOOD_MENUS: Record<string, MenuSection[]> = {};

export function getCampusMenu(name: string): MenuSection[] | null {
  return CAMPUS_FOOD_MENUS[name.toLowerCase().trim()] ?? null;
}

export const CAMPUS_TIMINGS: Record<string, string> = {
  "cafe coffee day": "Check on-site",
  "4th block cafe": "Check on-site",
  "k e cafe": "Check on-site",
  mingos: "Check on-site",
  kiosk: "Check on-site",
  chapel: "Check on-site",
  nandini: "Check on-site",
  fresheteria: "Check on-site",
  stall: "Check on-site",
  "just bake": "Check on-site",
  "punjabi bites": "Check on-site",
  "michael's": "Check on-site",
  "eleven 11": "Check on-site",
  "christ bakery": "Check on-site",
  "health center": "Check on-site",
  "stationery- nice service": "Check on-site",
};

export function getCampusTiming(
  name: string,
  apiTiming?: string | null,
): string | null {
  return apiTiming || CAMPUS_TIMINGS[name.toLowerCase().trim()] || null;
}

export function isCampusFoodPlace(
  type?: string | null,
  subType?: string | null,
): boolean {
  const FOOD_SUB_TYPES = new Set([
    "cafe",
    "snacks",
    "bakery",
    "restaurant",
    "canteen",
    "mess",
  ]);
  return (
    (type ?? "").toLowerCase() === "food" ||
    FOOD_SUB_TYPES.has((subType ?? "").toLowerCase())
  );
}
