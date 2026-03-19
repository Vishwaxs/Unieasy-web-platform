import { useAuth } from "@clerk/clerk-react";
import { ThumbsUp, ThumbsDown, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useReactionCounts,
  useToggleReaction,
  useUserReactions,
  type ReactionType,
} from "@/hooks/useReactions";

interface ReactionBarProps {
  placeId: string;
}

const ReactionBar = ({ placeId }: ReactionBarProps) => {
  const { isSignedIn } = useAuth();
  const { data: counts } = useReactionCounts(placeId);
  const { data: userReactions } = useUserReactions();
  const toggleMutation = useToggleReaction(placeId);

  // Collect all reactions the current user has for this place
  const myReactionSet = new Set(
    userReactions?.filter((r) => r.place_id === placeId).map((r) => r.reaction) ?? []
  );
  const liked = myReactionSet.has("like");
  const disliked = myReactionSet.has("dislike");
  const bookmarked = myReactionSet.has("bookmark");

  const handleReaction = (reaction: ReactionType) => {
    if (!isSignedIn) return;
    toggleMutation.mutate(reaction);
  };

  const pending = !isSignedIn || toggleMutation.isPending;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleReaction("like")}
        disabled={pending || disliked}
        className={`gap-1.5 transition-colors ${liked ? "border-green-500 text-green-500" : ""} ${disliked ? "opacity-30" : ""}`}
      >
        <ThumbsUp className={`w-4 h-4 ${liked ? "fill-green-500 text-green-500" : ""}`} />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleReaction("dislike")}
        disabled={pending || liked}
        className={`gap-1.5 transition-colors ${disliked ? "border-red-500 text-red-500" : ""} ${liked ? "opacity-30" : ""}`}
      >
        <ThumbsDown className={`w-4 h-4 ${disliked ? "fill-red-500 text-red-500" : ""}`} />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleReaction("bookmark")}
        disabled={pending}
        className={`gap-1.5 transition-colors ${bookmarked ? "border-primary text-primary" : ""}`}
      >
        <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-primary text-primary" : ""}`} />
      </Button>
    </div>
  );
};

export default ReactionBar;
