import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabase";

/**
 * Returns the `role` column from `app_users` for the current Clerk user.
 * Cached in local state for the lifetime of the component (session-level).
 * Returns `null` while loading or if the user is not signed in.
 */
export function useUserRole(): string | null {
  const { isSignedIn, user } = useUser();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !user) {
      setRole(null);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from("app_users")
          .select("role")
          .eq("clerk_user_id", user.id)
          .single();

        if (error) {
          console.error("[useUserRole] Error fetching role:", error.message);
          setRole(null);
        } else {
          setRole(data?.role ?? null);
        }
      } catch (err) {
        console.error("[useUserRole] Unexpected error:", err);
        setRole(null);
      }
    };

    fetchRole();
  }, [isSignedIn, user]);

  return role;
}
