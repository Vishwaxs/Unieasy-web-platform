import { describe, it, expect } from "vitest";
import type { ReviewEntry, ReviewRating } from "@/components/ReviewDialog";
import {
  getAverageEmoji,
  computeCombinedReviewStats,
  formatCompactCount,
  ratingOptions,
} from "@/lib/reviewStats";

function makeReview(rating: ReviewRating, id = "r"): ReviewEntry {
  return {
    id,
    text: "sample",
    createdAt: "2026-01-01T00:00:00.000Z",
    author: "tester",
    rating,
    contextValue: "default",
  };
}

describe("ratingOptions", () => {
  it("covers all five ratings in ascending order", () => {
    expect(ratingOptions.map((o) => o.value)).toEqual([1, 2, 3, 4, 5]);
    for (const option of ratingOptions) {
      expect(option.emoji).toBeTruthy();
      expect(option.label).toBeTruthy();
    }
  });
});

describe("getAverageEmoji", () => {
  it("returns empty string for non-positive or non-finite input", () => {
    expect(getAverageEmoji(0)).toBe("");
    expect(getAverageEmoji(-3)).toBe("");
    expect(getAverageEmoji(NaN)).toBe("");
    // Number.isFinite(Infinity) === false, so the guard returns ""
    expect(getAverageEmoji(Number.POSITIVE_INFINITY)).toBe("");
  });

  it("maps each rating band to the correct emoji", () => {
    expect(getAverageEmoji(1)).toBe("😞"); // < 1.5
    expect(getAverageEmoji(1.49)).toBe("😞");
    expect(getAverageEmoji(1.5)).toBe("😕"); // [1.5, 2.5)
    expect(getAverageEmoji(2.49)).toBe("😕");
    expect(getAverageEmoji(2.5)).toBe("🙂"); // [2.5, 3.5)
    expect(getAverageEmoji(3.49)).toBe("🙂");
    expect(getAverageEmoji(3.5)).toBe("😋"); // [3.5, 4.5)
    expect(getAverageEmoji(4.49)).toBe("😋");
    expect(getAverageEmoji(4.5)).toBe("🤩"); // >= 4.5
    expect(getAverageEmoji(5)).toBe("🤩");
  });
});

describe("computeCombinedReviewStats", () => {
  it("returns zeros when there are no reviews at all", () => {
    expect(computeCombinedReviewStats(0, 0, [])).toEqual({
      averageRating: 0,
      totalReviews: 0,
      emoji: "",
    });
    expect(computeCombinedReviewStats(4.2, 0, undefined)).toEqual({
      averageRating: 0,
      totalReviews: 0,
      emoji: "",
    });
  });

  it("returns the base stats when there are no local reviews", () => {
    const result = computeCombinedReviewStats(4, 10, []);
    expect(result.totalReviews).toBe(10);
    expect(result.averageRating).toBe(4);
    expect(result.emoji).toBe("😋");
  });

  it("weights the base rating by its count when combining with local reviews", () => {
    // base: avg 4 over 2 reviews => sum 8; local: one 2-star => sum 2
    // combined: 10 / 3 = 3.333...
    const result = computeCombinedReviewStats(4, 2, [makeReview(2)]);
    expect(result.totalReviews).toBe(3);
    expect(result.averageRating).toBeCloseTo(10 / 3, 10);
    expect(result.emoji).toBe("🙂");
  });

  it("computes the average from local reviews only when base count is zero", () => {
    const result = computeCombinedReviewStats(0, 0, [
      makeReview(5, "a"),
      makeReview(4, "b"),
    ]);
    expect(result.totalReviews).toBe(2);
    expect(result.averageRating).toBe(4.5);
    expect(result.emoji).toBe("🤩");
  });

  it("sanitizes negative and fractional base counts", () => {
    // base count -5 -> 0, base count 2.9 -> floor 2
    const negative = computeCombinedReviewStats(3, -5, [makeReview(3)]);
    expect(negative.totalReviews).toBe(1);
    expect(negative.averageRating).toBe(3);

    const fractional = computeCombinedReviewStats(4, 2.9, []);
    expect(fractional.totalReviews).toBe(2);
  });

  it("sanitizes non-finite base inputs", () => {
    const result = computeCombinedReviewStats(NaN, NaN, [makeReview(5)]);
    expect(result.totalReviews).toBe(1);
    expect(result.averageRating).toBe(5);
  });

  it("ignores non-numeric ratings inside local reviews", () => {
    const bad = { ...makeReview(5), rating: "5" as unknown as ReviewRating };
    const result = computeCombinedReviewStats(0, 0, [bad]);
    // rating coerced to 0 contribution, but still counted in totalReviews
    expect(result.totalReviews).toBe(1);
    expect(result.averageRating).toBe(0);
  });
});

describe("formatCompactCount", () => {
  it("returns plain numbers below 1000", () => {
    expect(formatCompactCount(0)).toBe("0");
    expect(formatCompactCount(42)).toBe("42");
    expect(formatCompactCount(999)).toBe("999");
  });

  it("formats thousands with one decimal, trimming trailing .0", () => {
    expect(formatCompactCount(1000)).toBe("1K");
    expect(formatCompactCount(1500)).toBe("1.5K");
    expect(formatCompactCount(9999)).toBe("10K"); // 9.999 -> toFixed(1) -> 10.0 -> 10
  });

  it("rounds to whole thousands between 10K and 1M", () => {
    expect(formatCompactCount(10000)).toBe("10K");
    expect(formatCompactCount(12345)).toBe("12K");
    expect(formatCompactCount(999499)).toBe("999K");
  });

  it("formats millions with one decimal, trimming trailing .0", () => {
    expect(formatCompactCount(1_000_000)).toBe("1M");
    expect(formatCompactCount(2_500_000)).toBe("2.5M");
  });

  it("clamps negative and non-finite input to 0", () => {
    expect(formatCompactCount(-100)).toBe("0");
    expect(formatCompactCount(NaN)).toBe("0");
    expect(formatCompactCount(Infinity)).toBe("0");
  });

  it("floors fractional counts before formatting", () => {
    expect(formatCompactCount(42.9)).toBe("42");
  });
});
