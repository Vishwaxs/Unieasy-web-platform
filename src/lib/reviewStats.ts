import type { ReviewEntry, ReviewRating } from "@/components/ReviewDialog";

export const ratingOptions: Array<{
  value: ReviewRating;
  emoji: string;
  label: string;
}> = [
  { value: 1, emoji: "😞", label: "Poor" },
  { value: 2, emoji: "😕", label: "Okay" },
  { value: 3, emoji: "🙂", label: "Good" },
  { value: 4, emoji: "😋", label: "Great" },
  { value: 5, emoji: "🤩", label: "Amazing" },
];

export function getAverageEmoji(averageRating: number): string {
  if (!Number.isFinite(averageRating) || averageRating <= 0) return "";
  if (averageRating < 1.5) return "😞";
  if (averageRating < 2.5) return "😕";
  if (averageRating < 3.5) return "🙂";
  if (averageRating < 4.5) return "😋";
  return "🤩";
}

export function computeCombinedReviewStats(
  baseRating: number,
  baseReviewCount: number,
  userReviews: ReviewEntry[] | undefined,
): { averageRating: number; totalReviews: number; emoji: string } {
  const safeBaseCount = Number.isFinite(baseReviewCount)
    ? Math.max(0, Math.floor(baseReviewCount))
    : 0;
  const safeBaseRating = Number.isFinite(baseRating) ? Math.max(0, baseRating) : 0;

  const localReviews = Array.isArray(userReviews) ? userReviews : [];
  const localCount = localReviews.length;

  const totalReviews = safeBaseCount + localCount;
  if (totalReviews === 0) {
    return { averageRating: 0, totalReviews: 0, emoji: "" };
  }

  const localRatingSum = localReviews.reduce(
    (sum, review) => sum + (typeof review.rating === "number" ? review.rating : 0),
    0,
  );

  const weightedSum = safeBaseRating * safeBaseCount + localRatingSum;
  const averageRating = weightedSum / totalReviews;

  return {
    averageRating,
    totalReviews,
    emoji: getAverageEmoji(averageRating),
  };
}

export function formatCompactCount(count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (safe < 1000) return String(safe);

  if (safe < 10000) {
    const value = safe / 1000;
    return `${value.toFixed(1).replace(/\.0$/, "")}K`;
  }

  if (safe < 1_000_000) {
    return `${Math.round(safe / 1000)}K`;
  }

  const value = safe / 1_000_000;
  return `${value.toFixed(1).replace(/\.0$/, "")}M`;
}
