import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Star, ThumbsUp, ThumbsDown, ShieldCheck, Pencil } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/components/RatingBadge";

interface ReviewSectionProps {
  placeId: string;
  placeName: string;
}

type ReviewRow = {
  id: string;
  rating: number;
  body: string;
  is_anonymous: boolean | null;
  verified_student: boolean | null;
  helpful_count: number | null;
  not_helpful_count: number | null;
  merchant_reply: string | null;
  reply_at: string | null;
  photo_urls: string[] | null;
  created_at: string;
  clerk_user_id?: string;
  app_users?: {
    full_name: string | null;
    avatar_url: string | null;
    verified_student: boolean | null;
  } | null;
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

function Stars({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={[
            "h-4 w-4",
            s <= safe ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/40",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

export default function ReviewSection({ placeId, placeName }: ReviewSectionProps) {
  const { user, isSignedIn } = useUser();

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const myReview = useMemo(() => {
    if (!user?.id) return null;
    return reviews.find((r) => r.clerk_user_id === user.id) ?? null;
  }, [reviews, user?.id]);

  const canWriteNew = isSignedIn && !myReview && !isEditing;

  const ratingSummary = useMemo(() => {
    const total = reviews.length;
    const buckets = [0, 0, 0, 0, 0, 0]; // [0..5]
    let sum = 0;
    for (const r of reviews) {
      const rating = Math.max(1, Math.min(5, Math.round(r.rating || 0)));
      buckets[rating] += 1;
      sum += rating;
    }
    const avg = total > 0 ? sum / total : 0;
    return { total, buckets, avg };
  }, [reviews]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id, place_id, clerk_user_id, rating, body, is_anonymous, verified_student, helpful_count, not_helpful_count,
        merchant_reply, reply_at, photo_urls, created_at,
        app_users!reviews_clerk_user_id_fkey(full_name, avatar_url, verified_student)
      `,
      )
      .eq("place_id", placeId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error) {
      setReviews((data ?? []) as ReviewRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  useEffect(() => {
    if (myReview && isEditing) {
      setSelectedRating(myReview.rating ?? 5);
      setReviewText(myReview.body ?? "");
      setIsAnonymous(!!myReview.is_anonymous);
    }
  }, [myReview, isEditing]);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Please sign in to write a review");
      return;
    }
    const body = reviewText.trim();
    if (selectedRating < 1 || selectedRating > 5) {
      toast.error("Please select a rating");
      return;
    }
    if (body.length < 10 || body.length > 1000) {
      toast.error("Review must be 10–1000 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      if (myReview) {
        const { error } = await supabase
          .from("reviews")
          .update({
            rating: selectedRating,
            body,
            is_anonymous: isAnonymous,
          })
          .eq("id", myReview.id);
        if (error) throw new Error(error.message);
        toast.success("Review updated");
      } else {
        const { error } = await supabase.from("reviews").insert({
          place_id: placeId,
          clerk_user_id: user.id,
          rating: selectedRating,
          body,
          is_anonymous: isAnonymous,
          verified_student: true,
        });
        if (error) throw new Error(error.message);
        toast.success("Review submitted");
      }

      setIsEditing(false);
      setReviewText("");
      setSelectedRating(5);
      setIsAnonymous(false);
      await fetchReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit review";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateHelpful = async (reviewId: string, type: "helpful" | "not_helpful") => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;

    const nextHelpful = (target.helpful_count ?? 0) + (type === "helpful" ? 1 : 0);
    const nextNotHelpful =
      (target.not_helpful_count ?? 0) + (type === "not_helpful" ? 1 : 0);

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, helpful_count: nextHelpful, not_helpful_count: nextNotHelpful }
          : r,
      ),
    );

    await supabase
      .from("reviews")
      .update({
        helpful_count: nextHelpful,
        not_helpful_count: nextNotHelpful,
      })
      .eq("id", reviewId);
  };

  return (
    <section id="reviews" className="rounded-2xl border border-border bg-card p-6 scroll-mt-24">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Reviews</h3>
          <p className="text-sm text-muted-foreground">
            Share what you think about {placeName}.
          </p>
        </div>

        {myReview && !isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        ) : null}
      </div>

      {/* Rating summary */}
      <div className="mb-6 rounded-xl border border-border bg-background/60 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-foreground leading-none">
              {ratingSummary.total > 0 ? ratingSummary.avg.toFixed(1) : "—"}
            </div>
            <div className="space-y-1">
              <Stars value={ratingSummary.avg} />
              <div className="inline-flex items-center rounded-xl bg-[#1a7340] px-3 py-1 text-white text-xs shadow-md">
                {formatCount(ratingSummary.total)} reviews
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-1 max-w-md">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingSummary.buckets[star] || 0;
              const pct =
                ratingSummary.total > 0 ? Math.round((count / ratingSummary.total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-10 text-xs text-muted-foreground">{star}★</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary/80" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Write/Edit form */}
      {(canWriteNew || isEditing) && (
        <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-sm font-medium text-foreground">
              {isEditing ? "Edit your review" : "Write a review"}
            </div>
            <div className="text-xs text-muted-foreground">
              {reviewText.length}/1000
            </div>
          </div>

          <div className="mb-3">
            <div className="text-sm font-medium text-foreground mb-1">Rating</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={[
                      "w-7 h-7 transition-colors",
                      star <= selectedRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground/40",
                    ].join(" ")}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience (10-1000 characters)..."
              rows={4}
              maxLength={1000}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="mt-1 text-xs text-muted-foreground">
              Minimum 10 characters.
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input
              id="review-anon"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="review-anon" className="text-sm text-muted-foreground">
              Post anonymously
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : isEditing ? "Save changes" : "Submit review"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setReviewText("");
                setSelectedRating(5);
                setIsAnonymous(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-6 text-center">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          Be the first to review!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isAnon = !!review.is_anonymous;
            const displayName = isAnon ? "Anonymous Student" : review.app_users?.full_name || "Student";
            const avatarUrl = isAnon ? null : review.app_users?.avatar_url || null;
            const initial = (displayName || "S").trim().charAt(0).toUpperCase();
            const verified = !!review.verified_student || !!review.app_users?.verified_student;
            return (
              <div key={review.id} className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-primary">{initial}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{displayName}</span>
                        {verified ? (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          >
                            <ShieldCheck className="w-3 h-3 mr-0.5" />
                            Verified Student
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Stars value={review.rating} />
                        <span className="text-xs text-muted-foreground">{relativeTime(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {review.body}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateHelpful(review.id, "helpful")}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-600 transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Helpful ({review.helpful_count ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => updateHelpful(review.id, "not_helpful")}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    Not helpful ({review.not_helpful_count ?? 0})
                  </button>
                </div>

                {review.merchant_reply ? (
                  <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
                    <div className="text-xs font-semibold text-foreground mb-1">
                      Business Reply:
                      {review.reply_at ? (
                        <span className="ml-2 font-normal text-muted-foreground">
                          {relativeTime(review.reply_at)}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {review.merchant_reply}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {!isSignedIn ? (
        <p className="text-sm text-muted-foreground text-center mt-4">
          Sign in to write a review.
        </p>
      ) : null}
    </section>
  );
}
