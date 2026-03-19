import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { ThumbsDown, ThumbsUp, Bookmark } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type ReactionType = "like" | "dislike" | "bookmark";

type MyReactionRow = { reaction: ReactionType };

type ReactionButtonsProps = {
  placeId: string;
  initialCounts: { likes: number; dislikes: number; bookmarks: number };
};

export default function ReactionButtons({ placeId, initialCounts }: ReactionButtonsProps) {
  const { user, isSignedIn } = useUser();

  const [myReactions, setMyReactions] = useState<MyReactionRow[]>([]);
  const [counts, setCounts] = useState(initialCounts);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setCounts(initialCounts);
  }, [initialCounts.likes, initialCounts.dislikes, initialCounts.bookmarks]);

  useEffect(() => {
    let cancelled = false;

    const fetchMine = async () => {
      if (!isSignedIn || !user?.id) {
        if (!cancelled) setMyReactions([]);
        return;
      }

      const { data, error } = await supabase
        .from("user_reactions")
        .select("reaction")
        .eq("place_id", placeId)
        .eq("clerk_user_id", user.id);

      if (cancelled) return;
      if (error) {
        setMyReactions([]);
        return;
      }
      setMyReactions((data ?? []) as MyReactionRow[]);
    };

    fetchMine();
    return () => {
      cancelled = true;
    };
  }, [placeId, isSignedIn, user?.id]);

  const active = useMemo(() => {
    const set = new Set<ReactionType>();
    for (const r of myReactions) set.add(r.reaction);
    return set;
  }, [myReactions]);

  const refetchCounts = async () => {
    const { data } = await supabase
      .from("places")
      .select("like_count, dislike_count, bookmark_count")
      .eq("id", placeId)
      .single();
    if (data) {
      setCounts({
        likes: data.like_count ?? 0,
        dislikes: data.dislike_count ?? 0,
        bookmarks: data.bookmark_count ?? 0,
      });
    }
  };

  const toggleReaction = async (reactionType: ReactionType) => {
    if (!isSignedIn || !user?.id) {
      toast.error("Please sign in to react");
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);

    const opposite: ReactionType | null =
      reactionType === "like" ? "dislike" : reactionType === "dislike" ? "like" : null;
    const hasReaction = myReactions.some((r) => r.reaction === reactionType);
    const hasOpposite = opposite ? myReactions.some((r) => r.reaction === opposite) : false;

    try {
      if (hasReaction) {
        // Toggle off — remove current reaction
        const { error } = await supabase
          .from("user_reactions")
          .delete()
          .eq("place_id", placeId)
          .eq("clerk_user_id", user.id)
          .eq("reaction", reactionType);
        if (!error) {
          setMyReactions((prev) => prev.filter((r) => r.reaction !== reactionType));
        }
      } else {
        // Remove opposite (like <-> dislike) from DB if present
        if (opposite && hasOpposite) {
          await supabase
            .from("user_reactions")
            .delete()
            .eq("place_id", placeId)
            .eq("clerk_user_id", user.id)
            .eq("reaction", opposite);
        }

        // Insert new reaction
        const { error } = await supabase.from("user_reactions").insert({
          place_id: placeId,
          clerk_user_id: user.id,
          reaction: reactionType,
        });
        if (!error) {
          // Remove opposite from local state and add new reaction
          setMyReactions((prev) => [
            ...prev.filter((r) => r.reaction !== opposite),
            { reaction: reactionType },
          ]);
        }
      }

      await refetchCounts();
    } finally {
      setIsProcessing(false);
    }
  };

  const liked = active.has("like");
  const disliked = active.has("dislike");
  const bookmarked = active.has("bookmark");

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => toggleReaction("like")}
        disabled={isProcessing || disliked}
        className={`gap-1.5 transition-colors ${liked ? "border-green-500 text-green-500" : ""} ${disliked ? "opacity-30" : ""}`}
      >
        <ThumbsUp className={`w-4 h-4 ${liked ? "fill-green-500 text-green-500" : ""}`} />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => toggleReaction("dislike")}
        disabled={isProcessing || liked}
        className={`gap-1.5 transition-colors ${disliked ? "border-red-500 text-red-500" : ""} ${liked ? "opacity-30" : ""}`}
      >
        <ThumbsDown className={`w-4 h-4 ${disliked ? "fill-red-500 text-red-500" : ""}`} />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => toggleReaction("bookmark")}
        disabled={isProcessing}
        className={`gap-1.5 transition-colors ${bookmarked ? "border-primary text-primary" : ""}`}
      >
        <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-primary text-primary" : ""}`} />
      </Button>
    </div>
  );
}

