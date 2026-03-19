import { useAuth } from "@clerk/clerk-react";
import { ThumbsUp, ThumbsDown, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useReactionCounts,
  useToggleReaction,
  type ReactionType,
} from "@/hooks/useReactions";

interface ReactionBarProps {
  placeId: string;
}

const ReactionBar = ({ placeId }: ReactionBarProps) => {
  const { isSignedIn } = useAuth();
  const { data: counts } = useReactionCounts(placeId);
  const toggleMutation = useToggleReaction(placeId);

  const handleReaction = (reaction: ReactionType) => {
    if (!isSignedIn) return;
    toggleMutation.mutate(reaction);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleReaction("like")}
        disabled={!isSignedIn || toggleMutation.isPending}
        className="gap-1.5"
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleReaction("dislike")}
        disabled={!isSignedIn || toggleMutation.isPending}
        className="gap-1.5"
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleReaction("bookmark")}
        disabled={!isSignedIn || toggleMutation.isPending}
        className="gap-1.5"
      >
        <Bookmark className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ReactionBar;
