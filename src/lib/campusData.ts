/**
 * Static fallback data for on-campus places.
 *
 * All image URLs are mock placeholders until real images are available.
 */

function seededImage(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/700`;
}

function normalizedKey(value?: string | null): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const NAME_ALIASES: Record<string, string> = {
  "freshteria": "fresheteria",
  "michael": "michaels",
  "michaels": "michaels",
};

export function normalizeCampusName(name: string): string {
  const key = normalizedKey(name);
  return NAME_ALIASES[key] ?? key;
}

const CAMPUS_NAME_IMAGE_OVERRIDES: Record<string, string> = {
  nandini: seededImage("campus-nandini"),
  mingos: seededImage("campus-mingos"),
  "just bake": seededImage("campus-just-bake"),
  "punjabi bites": seededImage("campus-punjabi-bites"),
  fresheteria: seededImage("campus-fresheteria"),
  michaels: seededImage("campus-michaels"),
  kiosk: seededImage("campus-kiosk"),
};

const IMAGE_POOLS = {
  sports: [
    seededImage("campus-sports-1"),
    seededImage("campus-sports-2"),
    seededImage("campus-sports-3"),
  ],
  department: [
    seededImage("campus-department-1"),
    seededImage("campus-department-2"),
    seededImage("campus-department-3"),
  ],
  theatre: [
    seededImage("campus-theatre-1"),
    seededImage("campus-theatre-2"),
    seededImage("campus-theatre-3"),
  ],
  classroom: [
    seededImage("campus-classroom-1"),
    seededImage("campus-classroom-2"),
    seededImage("campus-classroom-3"),
  ],
  lab: [
    seededImage("campus-lab-1"),
    seededImage("campus-lab-2"),
    seededImage("campus-lab-3"),
  ],
  ground: [
    seededImage("campus-ground-1"),
    seededImage("campus-ground-2"),
    seededImage("campus-ground-3"),
  ],
  playground: [
    seededImage("campus-playground-1"),
    seededImage("campus-playground-2"),
    seededImage("campus-playground-3"),
  ],
  food: [
    seededImage("campus-food-1"),
    seededImage("campus-food-2"),
    seededImage("campus-food-3"),
  ],
  services: [
    seededImage("campus-services-1"),
    seededImage("campus-services-2"),
    seededImage("campus-services-3"),
  ],
  generic: [
    seededImage("campus-generic-1"),
    seededImage("campus-generic-2"),
    seededImage("campus-generic-3"),
    seededImage("campus-generic-4"),
    seededImage("campus-generic-5"),
  ],
};

function hashString(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickSeeded<T>(items: T[], seed: string): T {
  return items[hashString(seed) % items.length];
}

function imagePoolFor(type?: string | null, subType?: string | null): string[] {
  const haystack = `${normalizedKey(type)} ${normalizedKey(subType)}`;

  if (/(playground)/.test(haystack)) return IMAGE_POOLS.playground;
  if (/(sports|sport)/.test(haystack)) return IMAGE_POOLS.sports;
  if (/(department|dept)/.test(haystack)) return IMAGE_POOLS.department;
  if (/(theatre|theater|auditorium)/.test(haystack)) return IMAGE_POOLS.theatre;
  if (/(classroom|class room|lecture|hall)/.test(haystack)) return IMAGE_POOLS.classroom;
  if (/(lab|laboratory)/.test(haystack)) return IMAGE_POOLS.lab;
  if (/(ground|field|court)/.test(haystack)) return IMAGE_POOLS.ground;
  if (/(food|cafe|canteen|snacks|bakery|restaurant|mess)/.test(haystack)) return IMAGE_POOLS.food;
  if (/(service|office|admin|health|stationery|store|shop|chapel|prayer)/.test(haystack)) {
    return IMAGE_POOLS.services;
  }
  return IMAGE_POOLS.generic;
}

export function getCampusImage(
  name: string,
  subType?: string | null,
  type?: string | null,
): string {
  const normalizedName = normalizeCampusName(name);
  const nameImage = CAMPUS_NAME_IMAGE_OVERRIDES[normalizedName];
  if (nameImage) return nameImage;

  const pool = imagePoolFor(type, subType);
  return pickSeeded(pool, `${normalizedName}|${normalizedKey(type)}|${normalizedKey(subType)}`);
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
  michaels: "Check on-site",
  "eleven 11": "Check on-site",
  "christ bakery": "Check on-site",
  "health center": "Check on-site",
  "stationery- nice service": "Check on-site",
};

export function getCampusTiming(
  name: string,
  apiTiming?: string | null,
): string | null {
  const normalizedName = normalizeCampusName(name);
  return apiTiming || CAMPUS_TIMINGS[normalizedName] || null;
}

const CAMPUS_DETAIL_ALLOWLIST = new Set([
  "nandini",
  "mingos",
  "just bake",
  "michaels",
  "punjabi bites",
  "fresheteria",
  "kiosk",
]);

export function canOpenCampusDetails(name: string): boolean {
  return CAMPUS_DETAIL_ALLOWLIST.has(normalizeCampusName(name));
}

function isPrayerOrChapelName(name?: string | null): boolean {
  const normalizedName = normalizedKey(name);
  return /(chapel|prayer|prayer room|oratory|worship)/.test(normalizedName);
}

export function isCampusFoodPlace(
  name?: string | null,
  type?: string | null,
  subType?: string | null,
): boolean {
  if (isPrayerOrChapelName(name)) return false;

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
