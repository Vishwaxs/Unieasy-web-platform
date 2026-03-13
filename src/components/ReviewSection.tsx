import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Star, ThumbsUp, ThumbsDown, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useReviews,
  useCreateReview,
  useReviewHelpful,
  useDeleteReview,
  type Review,
} from "@/hooks/useReviews";

interface ReviewSectionProps {
  placeId: string;
}

const ReviewSection = ({ placeId }: ReviewSectionProps) => {
  const { user, isSignedIn } = useUser();
  const { data, isLoading } = useReviews(placeId);
  const createMutation = useCreateReview(placeId);
  const helpfulMutation = useReviewHelpful();
  const deleteMutation = useDeleteReview();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const reviews = data?.data || [];
  const reviewCount = data?.count || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (body.length < 10) {
      setSubmitError("Review must be at least 10 characters.");
      return;
    }
    try {
      await createMutation.mutateAsync({ rating, body, is_anonymous: isAnonymous });
      setShowForm(false);
      setBody("");
      setRating(5);
      setIsAnonymous(false);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit review"
      );
    }
  };

  const handleHelpful = (reviewId: string, type: "helpful" | "not-helpful") => {
    helpfulMutation.mutate({ reviewId, type });
  };

  const handleDelete = (reviewId: string) => {
    if (window.confirm("Delete your review? This cannot be undone.")) {
      deleteMutation.mutate(reviewId);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Reviews {reviewCount > 0 && `(${reviewCount})`}
        </h3>
        {isSignedIn && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-foreground mb-1">
              Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-foreground mb-1">
              Your Review
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your experience (10-1000 characters)..."
              rows={4}
              maxLength={1000}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {body.length}/1000 characters
            </p>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="anonymous" className="text-sm text-muted-foreground">
              Post anonymously
            </label>
          </div>

          {submitError && (
            <p className="text-sm text-red-500 mb-3">{submitError}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setSubmitError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No reviews yet. Be the first to share your experience!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: Review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border bg-background/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {review.app_users?.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {review.app_users?.full_name || "Anonymous"}
                      </span>
                      {review.verified_student && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        >
                          <ShieldCheck className="w-3 h-3 mr-0.5" />
                          Verified Student
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete button for own reviews */}
                {user && review.clerk_user_id === user.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(review.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-sm text-foreground mt-2 leading-relaxed">
                {review.body}
              </p>

              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => handleHelpful(review.id, "helpful")}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-600 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Helpful ({review.helpful_count})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleHelpful(review.id, "not-helpful")}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Not helpful ({review.not_helpful_count})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isSignedIn && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          Sign in with your Christ University email to write a review.
        </p>
      )}
    </div>
  );
};

export default ReviewSection;
