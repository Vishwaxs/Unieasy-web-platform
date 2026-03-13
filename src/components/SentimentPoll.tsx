import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSentiment, useVoteSentiment, type Sentiment } from "@/hooks/useSentiment";

interface SentimentPollProps {
  placeId: string;
}

const EMOJI_CONFIG: { key: Sentiment; emoji: string; label: string; color: string }[] = [
  { key: "love", emoji: "\u{1F60D}", label: "Love it", color: "bg-pink-500" },
  { key: "like", emoji: "\u{1F60A}", label: "Like it", color: "bg-green-500" },
  { key: "neutral", emoji: "\u{1F610}", label: "It's okay", color: "bg-yellow-500" },
  { key: "dislike", emoji: "\u{1F615}", label: "Not great", color: "bg-orange-500" },
  { key: "terrible", emoji: "\u{1F620}", label: "Terrible", color: "bg-red-500" },
];

const SentimentPoll = ({ placeId }: SentimentPollProps) => {
  const { isSignedIn } = useUser();
  const { data, isLoading } = useSentiment(placeId);
  const voteMutation = useVoteSentiment(placeId);
  const [voting, setVoting] = useState(false);

  const handleVote = async (sentiment: Sentiment) => {
    if (!isSignedIn || voting) return;
    setVoting(true);
    try {
      await voteMutation.mutateAsync(sentiment);
    } catch {
      // Error handled by mutation
    } finally {
      setVoting(false);
    }
  };

  const total = data?.total || 0;
  const userVote = data?.userVote;
  const distribution = data?.distribution || {
    love: 0,
    like: 0,
    neutral: 0,
    dislike: 0,
    terrible: 0,
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1">
        How do you feel about this place?
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {userVote
          ? "You voted! Here are the results."
          : isSignedIn
          ? "Share your vibe!"
          : "Sign in to vote"}
      </p>

      {/* Emoji buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-5">
        {EMOJI_CONFIG.map(({ key, emoji, label }) => {
          const isSelected = userVote === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleVote(key)}
              disabled={!isSignedIn || voting || isLoading}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all
                ${
                  isSelected
                    ? "bg-primary/15 ring-2 ring-primary scale-110 shadow-md"
                    : "bg-muted/50 hover:bg-muted hover:scale-105"
                }
                ${!isSignedIn ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs text-muted-foreground font-medium">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results bars */}
      {total > 0 && (
        <div className="space-y-2">
          {EMOJI_CONFIG.map(({ key, emoji, label, color }) => {
            const count = distribution[key];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-sm w-6 text-center">{emoji}</span>
                <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center pl-2 text-xs font-medium text-foreground">
                    {label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {pct}%
                </span>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground text-center mt-2">
            {total} vote{total !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
};

export default SentimentPoll;
