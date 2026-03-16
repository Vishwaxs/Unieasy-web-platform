import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  computeCombinedReviewStats,
  incrementUserReviewCount,
  ratingOptions,
} from "@/lib/reviewStats";
import GoogleRatingBadge from "@/components/GoogleRatingBadge";

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export type ReviewEntry = {
  id: string;
  text: string;
  createdAt: string;
  author: string;
  rating: ReviewRating;
  contextValue: string;
};

export type ReviewContextOption = {
  value: string;
  label: string;
};

export type ReviewItemSummary = {
  id: string;
  name: string;
  rating?: number;
  reviews: number;
};

type ReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeItem: ReviewItemSummary | null;
  reviewsByItem: Record<string, ReviewEntry[]>;
  setReviewsByItem: React.Dispatch<
    React.SetStateAction<Record<string, ReviewEntry[]>>
  >;
  contextLabel: string;
  contextOptions: ReviewContextOption[];
  contextPlaceholder?: string;
};

export default function ReviewDialog({
  open,
  onOpenChange,
  activeItem,
  reviewsByItem,
  setReviewsByItem,
  contextLabel,
  contextOptions,
  contextPlaceholder,
}: ReviewDialogProps) {
  const { openSignIn } = useClerk();
  const { isSignedIn, user } = useUser();
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState<ReviewRating | null>(null);
  const [contextValue, setContextValue] = useState("");

  const listingStats = useMemo(() => {
    if (!activeItem) {
      return { averageRating: 0, totalReviews: 0, emoji: "" };
    }
    return computeCombinedReviewStats(
      typeof activeItem.rating === "number" ? activeItem.rating : 0,
      activeItem.reviews,
      reviewsByItem[activeItem.id],
    );
  }, [activeItem, reviewsByItem]);

  const optionLabelByValue = useMemo(
    () => new Map(contextOptions.map((option) => [option.value, option.label])),
    [contextOptions],
  );

  useEffect(() => {
    if (!open) return;
    setReviewText("");
    setReviewRating(null);
    setContextValue("");
  }, [open, activeItem?.id]);

  const submitReview = () => {
    if (!activeItem || !isSignedIn) return;

    const text = reviewText.trim();
    if (!text || !reviewRating || !contextValue) return;

    const newReview: ReviewEntry = {
      id: `${activeItem.id}-${Date.now()}`,
      text,
      createdAt: new Date().toLocaleString(),
      author:
        user?.firstName ||
        user?.username ||
        user?.primaryEmailAddress?.emailAddress ||
        "User",
      rating: reviewRating,
      contextValue,
    };

    setReviewsByItem((prev) => ({
      ...prev,
      [activeItem.id]: [newReview, ...(prev[activeItem.id] || [])],
    }));

    if (user?.id) {
      incrementUserReviewCount(user.id, 1);
    }

    setReviewText("");
    setReviewRating(null);
    setContextValue("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>
            Reviews{activeItem ? ` - ${activeItem.name}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {activeItem && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-foreground font-medium">
                  Listing review stats
                </p>
                <Badge variant="secondary">{listingStats.totalReviews} ratings</Badge>
              </div>
              <div className="mt-3">
                <GoogleRatingBadge
                  rating={listingStats.averageRating}
                  ratingCount={listingStats.totalReviews}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Includes listing stats + user-posted reviews.
              </p>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
            {activeItem && (reviewsByItem[activeItem.id] || []).length > 0 ? (
              (reviewsByItem[activeItem.id] || []).map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-sm">
                      {
                        ratingOptions.find((r) => r.value === review.rating)
                          ?.emoji
                      }{" "}
                      {
                        ratingOptions.find((r) => r.value === review.rating)
                          ?.label
                      }
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {optionLabelByValue.get(review.contextValue) ||
                        review.contextValue.replace("-", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{review.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {review.author} · {review.createdAt}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No user-posted reviews yet.
              </p>
            )}
          </div>

          <SignedIn>
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Your rating (required)
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {ratingOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setReviewRating(option.value)}
                      className={`rounded-md border px-2 py-2 text-center transition-colors ${
                        reviewRating === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <div className="text-lg leading-none">{option.emoji}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="reviewContextType"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  {contextLabel} (required)
                </label>
                <select
                  id="reviewContextType"
                  value={contextValue}
                  onChange={(e) => setContextValue(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
                >
                  <option value="">
                    {contextPlaceholder ||
                      `Select ${contextLabel.toLowerCase()}`}
                  </option>
                  {contextOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review..."
                className="w-full min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              />
              <div className="flex justify-end">
                <Button
                  onClick={submitReview}
                  disabled={
                    !reviewText.trim() || !reviewRating || !contextValue
                  }
                >
                  Post Review
                </Button>
              </div>
            </div>
          </SignedIn>

          <SignedOut>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              You need to sign in to post a review.
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    window.setTimeout(() => openSignIn(), 0);
                  }}
                >
                  Sign in to Post Review
                </Button>
              </div>
            </div>
          </SignedOut>
        </div>
      </DialogContent>
    </Dialog>
  );
}
