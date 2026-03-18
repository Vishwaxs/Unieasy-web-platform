import { Star } from "lucide-react";

export interface RatingBadgeProps {
  rating: number | null;
  ratingCount: number | null;
  reviewCount?: number;
  source?: "google" | "app" | "both";
  size?: "sm" | "md" | "lg";
}

export function formatCount(n: number | null): string {
  if (!n) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}

function GoogleGMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 533.5 544.3"
      className={className}
      aria-label="Google"
      role="img"
    >
      <path
        fill="#4285F4"
        d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h146.9c-6.1 33.9-25 63.7-53.7 82.9v68h86.8c50.9-46.9 81.4-116.1 81.4-200.4z"
      />
      <path
        fill="#34A853"
        d="M272.1 544.3c73.7 0 135.7-24.3 180.9-66.1l-86.8-68c-24.1 16.4-55.1 25.7-94.1 25.7-71.3 0-131.7-48.1-153.3-112.8H28.9v70.9c45.2 89.7 137.9 150.3 243.2 150.3z"
      />
      <path
        fill="#FBBC05"
        d="M118.8 323.1c-11.4-33.9-11.4-70.4 0-104.3V147.9H28.9c-39.2 78.4-39.2 170.1 0 248.5l89.9-73.3z"
      />
      <path
        fill="#EA4335"
        d="M272.1 108.2c40.1-.6 78.7 14 108.1 40.8l80.4-80.4C411.4 24.4 343.5-1.1 272.1 0 166.8 0 74.1 60.6 28.9 150.3l89.9 70.9c21.5-64.8 82-113 153.3-113z"
      />
    </svg>
  );
}

export default function RatingBadge({
  rating,
  ratingCount,
  reviewCount = 0,
  source = "google",
  size = "md",
}: RatingBadgeProps) {
  const safeRating = Number.isFinite(rating ?? NaN) ? (rating as number) : 0;
  const showRating = safeRating > 0;

  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
        <span>{showRating ? safeRating.toFixed(1) : "—"}</span>
        <span className="text-amber-400">★</span>
        <span className="text-xs text-muted-foreground">
          ({formatCount(ratingCount)} )
        </span>
      </span>
    );
  }

  const sizeClasses =
    size === "lg"
      ? {
          pad: "px-3.5 py-2.5",
          topText: "text-2xl md:text-3xl",
          bottomText: "text-xs",
          star: "h-5 w-5",
          g: "h-4 w-4",
        }
      : {
          pad: "px-3 py-2",
          topText: "text-xl",
          bottomText: "text-xs",
          star: "h-4 w-4",
          g: "h-3.5 w-3.5",
        };

  const showGoogle = source === "google" || source === "both";

  return (
    <div className="inline-flex flex-col items-center">
      <div
        className={[
          "rounded-xl bg-[#1a7340] text-white inline-flex flex-col items-center shadow-md",
          sizeClasses.pad,
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <div className={`font-bold leading-none ${sizeClasses.topText}`}>
            {showRating ? safeRating.toFixed(1) : "—"}
          </div>
          <Star
            className={`${sizeClasses.star} fill-amber-400 text-amber-400`}
          />
          {showGoogle ? <GoogleGMark className={`${sizeClasses.g}`} /> : null}
        </div>
        <div className={`mt-1 text-white/80 ${sizeClasses.bottomText}`}>
          {formatCount(ratingCount)} ratings
        </div>
      </div>

      {reviewCount > 0 ? (
        <div className="mt-2 text-xs font-medium text-primary">
          {reviewCount} student reviews
        </div>
      ) : null}
    </div>
  );
}

