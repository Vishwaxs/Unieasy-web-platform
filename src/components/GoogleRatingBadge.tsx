import { Star } from "lucide-react";

import { formatCompactCount, getAverageEmoji } from "@/lib/reviewStats";

type GoogleRatingBadgeProps = {
  rating: number;
  ratingCount: number;
  sourceLabel?: string;
  className?: string;
};

export default function GoogleRatingBadge({
  rating,
  ratingCount,
  sourceLabel = "Google",
  className,
}: GoogleRatingBadgeProps) {
  const safeRating = Number.isFinite(rating) ? rating : 0;
  const showRating = safeRating > 0;
  const emoji = getAverageEmoji(safeRating);

  return (
    <div className={className}>
      <div className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-primary-foreground">
        {showRating && emoji ? (
          <span className="text-sm font-semibold leading-none">{emoji}</span>
        ) : null}
        <span className="text-sm font-semibold leading-none">
          {showRating ? safeRating.toFixed(1) : "—"}
        </span>
        <Star className="h-4 w-4 fill-primary-foreground text-primary-foreground" />
      </div>

      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/80">{sourceLabel}</span>
        <span>{formatCompactCount(ratingCount)} ratings</span>
      </div>
    </div>
  );
}
