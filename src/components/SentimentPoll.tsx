import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

interface SentimentPollProps {
  placeId: string;
  initialCounts: {
    love: number;
    like: number;
    neutral: number;
    dislike: number;
    terrible: number;
  };
}

type Sentiment = "love" | "like" | "neutral" | "dislike" | "terrible";

const EMOJI_CONFIG: { key: Sentiment; emoji: string; label: string }[] = [
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "like", emoji: "👍", label: "Like" },
  { key: "neutral", emoji: "😐", label: "Neutral" },
  { key: "dislike", emoji: "👎", label: "Dislike" },
  { key: "terrible", emoji: "😡", label: "Terrible" },
];

const SentimentPoll = ({ placeId, initialCounts }: SentimentPollProps) => {
  const { user } = useUser();
  const [mySentiment, setMySentiment] = useState<Sentiment | null>(null);
  const [counts, setCounts] = useState(initialCounts);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    setCounts(initialCounts);
  }, [
    initialCounts.love,
    initialCounts.like,
    initialCounts.neutral,
    initialCounts.dislike,
    initialCounts.terrible,
  ]);

  useEffect(() => {
    let cancelled = false;
    const fetchMine = async () => {
      if (!user?.id) {
        if (!cancelled) setMySentiment(null);
        return;
      }
      const { data } = await supabase
        .from("sentiment_polls")
        .select("sentiment")
        .eq("place_id", placeId)
        .eq("clerk_user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setMySentiment((data?.sentiment as Sentiment | undefined) || null);
    };
    fetchMine();
    return () => {
      cancelled = true;
    };
  }, [placeId, user?.id]);

  const totalVotes = useMemo(() => {
    return (
      (counts.love || 0) +
      (counts.like || 0) +
      (counts.neutral || 0) +
      (counts.dislike || 0) +
      (counts.terrible || 0)
    );
  }, [counts]);

  const castVote = async (newSentiment: Sentiment) => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }
    if (isVoting) return;
    setIsVoting(true);

    try {
      if (mySentiment === newSentiment) {
        await supabase
          .from("sentiment_polls")
          .delete()
          .eq("place_id", placeId)
          .eq("clerk_user_id", user.id);
        setMySentiment(null);
      } else {
        await supabase.from("sentiment_polls").upsert(
          { place_id: placeId, clerk_user_id: user.id, sentiment: newSentiment },
          { onConflict: "place_id,clerk_user_id" },
        );
        setMySentiment(newSentiment);
      }

      const { data: place } = await supabase
        .from("places")
        .select(
          "sentiment_love, sentiment_like, sentiment_neutral, sentiment_dislike, sentiment_terrible",
        )
        .eq("id", placeId)
        .single();

      if (place) {
        setCounts({
          love: place.sentiment_love ?? 0,
          like: place.sentiment_like ?? 0,
          neutral: place.sentiment_neutral ?? 0,
          dislike: place.sentiment_dislike ?? 0,
          terrible: place.sentiment_terrible ?? 0,
        });
      }
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1">
        How do you feel about this place?
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {mySentiment ? "You voted! Tap again to remove." : user ? "Share your vibe!" : "Sign in to vote"}
      </p>

      {/* Emoji buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-5">
        {EMOJI_CONFIG.map(({ key, emoji, label }) => {
          const isSelected = mySentiment === key;
          const count = counts[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => castVote(key)}
              disabled={isVoting}
              className={`
                flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all
                ${
                  isSelected
                    ? "bg-primary/15 ring-2 ring-primary scale-110 shadow-md"
                    : "bg-muted/50 hover:bg-muted hover:scale-105"
                }
                ${!user ? "opacity-50" : ""}
              `}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <span className="text-xs font-semibold text-foreground/80">{count}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {totalVotes} student{totalVotes === 1 ? "" : "s"} voted
      </p>
    </div>
  );
};

export default SentimentPoll;
