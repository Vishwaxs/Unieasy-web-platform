// server/tests/validation.test.js
// Unit tests for the Zod request-validation schemas that guard the public
// Places API. These are pure, deterministic tests — no database, no network —
// so they run anywhere via Node's built-in test runner:  node --test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  listQuerySchema,
  idParamSchema,
  photoParamSchema,
  searchQuerySchema,
} from "../lib/validation.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("listQuerySchema", () => {
  it("applies default limit/offset for an empty query", () => {
    const parsed = listQuerySchema.parse({});
    assert.equal(parsed.limit, 50);
    assert.equal(parsed.offset, 0);
    assert.equal(parsed.category, undefined);
  });

  it("accepts every valid category", () => {
    for (const category of [
      "food", "accommodation", "study", "health", "fitness",
      "services", "transport", "campus", "essentials", "hangout",
      "safety", "events", "marketplace", "oncampus",
    ]) {
      assert.equal(listQuerySchema.parse({ category }).category, category);
    }
  });

  it("rejects an unknown category", () => {
    assert.equal(listQuerySchema.safeParse({ category: "nightclub" }).success, false);
  });

  it("coerces numeric limit/offset from query strings", () => {
    const parsed = listQuerySchema.parse({ limit: "25", offset: "10" });
    assert.equal(parsed.limit, 25);
    assert.equal(parsed.offset, 10);
  });

  it("enforces limit bounds (1..100)", () => {
    assert.equal(listQuerySchema.safeParse({ limit: "0" }).success, false);
    assert.equal(listQuerySchema.safeParse({ limit: "101" }).success, false);
    assert.equal(listQuerySchema.parse({ limit: "100" }).limit, 100);
  });

  it("rejects a negative offset", () => {
    assert.equal(listQuerySchema.safeParse({ offset: "-1" }).success, false);
  });

  it("rejects a non-integer limit", () => {
    assert.equal(listQuerySchema.safeParse({ limit: "5.5" }).success, false);
  });

  it("accepts a well-formed bbox and rejects a malformed one", () => {
    assert.equal(
      listQuerySchema.safeParse({ bbox: "12.9,77.5,13.1,77.7" }).success,
      true,
    );
    assert.equal(listQuerySchema.safeParse({ bbox: "12.9,77.5,13.1" }).success, false);
    assert.equal(listQuerySchema.safeParse({ bbox: "not,a,bounding,box" }).success, false);
  });

  it("only accepts the string enums 'true'/'false' for boolean flags", () => {
    assert.equal(listQuerySchema.parse({ is_veg: "true" }).is_veg, "true");
    assert.equal(listQuerySchema.safeParse({ is_veg: true }).success, false);
    assert.equal(listQuerySchema.safeParse({ is_on_campus: "yes" }).success, false);
  });

  it("rejects overly long type/sub_type filters", () => {
    assert.equal(listQuerySchema.safeParse({ type: "a".repeat(51) }).success, false);
    assert.equal(listQuerySchema.safeParse({ sub_type: "a".repeat(51) }).success, false);
  });
});

describe("idParamSchema", () => {
  it("accepts a valid UUID", () => {
    assert.equal(idParamSchema.parse({ id: VALID_UUID }).id, VALID_UUID);
  });

  it("rejects a non-UUID id", () => {
    assert.equal(idParamSchema.safeParse({ id: "42" }).success, false);
    assert.equal(idParamSchema.safeParse({ id: "" }).success, false);
  });
});

describe("photoParamSchema", () => {
  it("coerces and accepts an in-range index", () => {
    const parsed = photoParamSchema.parse({ id: VALID_UUID, index: "3" });
    assert.equal(parsed.index, 3);
  });

  it("enforces the 0..9 index bounds", () => {
    assert.equal(
      photoParamSchema.safeParse({ id: VALID_UUID, index: "0" }).success,
      true,
    );
    assert.equal(
      photoParamSchema.safeParse({ id: VALID_UUID, index: "-1" }).success,
      false,
    );
    assert.equal(
      photoParamSchema.safeParse({ id: VALID_UUID, index: "10" }).success,
      false,
    );
  });

  it("rejects when the id is invalid even if the index is fine", () => {
    assert.equal(photoParamSchema.safeParse({ id: "nope", index: "0" }).success, false);
  });
});

describe("searchQuerySchema", () => {
  it("requires a non-empty query and applies the default limit", () => {
    const parsed = searchQuerySchema.parse({ q: "coffee" });
    assert.equal(parsed.q, "coffee");
    assert.equal(parsed.limit, 20);
  });

  it("rejects an empty or overly long query", () => {
    assert.equal(searchQuerySchema.safeParse({ q: "" }).success, false);
    assert.equal(searchQuerySchema.safeParse({ q: "a".repeat(101) }).success, false);
  });

  it("enforces search limit bounds (1..50)", () => {
    assert.equal(searchQuerySchema.safeParse({ q: "x", limit: "0" }).success, false);
    assert.equal(searchQuerySchema.safeParse({ q: "x", limit: "51" }).success, false);
    assert.equal(searchQuerySchema.parse({ q: "x", limit: "50" }).limit, 50);
  });
});
