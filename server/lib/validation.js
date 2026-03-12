// server/lib/validation.js
// Zod schemas for request validation. Import and reuse across routes.
import { z } from "zod";

const VALID_CATEGORIES = [
    "food", "accommodation", "study", "health", "fitness",
    "services", "transport", "campus", "essentials", "hangout", "safety", "events", "marketplace", "oncampus",
];

export const listQuerySchema = z.object({
    category: z.enum(VALID_CATEGORIES).optional(),
    type: z.string().max(50).optional(),
    sub_type: z.string().max(50).optional(),
    is_veg: z.enum(["true", "false"]).optional(),
    bbox: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/).optional(),
    is_on_campus: z.enum(["true", "false"]).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({
    id: z.string().uuid("Invalid place ID format"),
});

export const photoParamSchema = z.object({
    id: z.string().uuid("Invalid place ID format"),
    index: z.coerce.number().int().min(0).max(9),
});
