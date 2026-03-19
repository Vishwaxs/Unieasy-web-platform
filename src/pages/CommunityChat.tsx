import { useState, useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Loader2,
  MessageCircle,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  user: { name: string; email: string | null };
}

async function apiFetchChat(
  getToken: () => Promise<string | null>,
  path: string,
  options?: RequestInit,
) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const CommunityChat = () => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userRole = (user?.publicMetadata as { role?: string })?.role;
  const isAdmin = userRole === "admin" || userRole === "superadmin";

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["community_messages"],
    queryFn: async () => {
      const json = await apiFetchChat(getToken, "/community/messages?limit=50");
      return (json.data || []).reverse(); // oldest first for display
    },
    enabled: !!isSignedIn,
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiFetchChat(getToken, "/community/messages", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["community_messages"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetchChat(getToken, `/community/messages/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_messages"] });
      toast.success("Message deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-10 container mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldAlert className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Sign In Required
            </h2>
            <p className="text-muted-foreground max-w-md">
              You must be signed in with your CHRIST University email to access
              the community chat.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="pt-20 pb-4 flex-1 flex flex-col container mx-auto px-4 max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Community Chat</h1>
          <Badge variant="secondary" className="text-xs">
            CHRIST University Students
          </Badge>
        </div>

        <div className="bg-card border border-border rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {!isLoading && (!messages || messages.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet. Be the first to say hello!</p>
              </div>
            )}

            {messages?.map((msg) => (
              <div key={msg.id} className="group flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                  {msg.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-sm text-foreground">
                      {msg.user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(msg.created_at)}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => deleteMutation.mutate(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3 text-destructive hover:text-destructive/80" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 break-words">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSend}
            className="border-t border-border p-3 flex gap-2"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              maxLength={500}
              disabled={sendMutation.isPending}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim() || sendMutation.isPending}
              className="rounded-xl px-4"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CommunityChat;
