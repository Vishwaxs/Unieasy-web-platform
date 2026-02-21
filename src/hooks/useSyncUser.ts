import { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabase";

/**
 * Upserts the current Clerk user into Supabase `app_users` table.
 * Runs once per sign-in session. Does NOT overwrite the `role` column.
 */
export function useSyncUser(): void {
  const { isSignedIn, user } = useUser();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user || hasSynced.current) return;

    const sync = async () => {
      try {
        const { error } = await supabase.from("app_users").upsert(
          {
            clerk_user_id: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? "",
            full_name: user.fullName ?? "",
          },
          { onConflict: "clerk_user_id" }
        );

        if (error) {
          console.error("[useSyncUser] Supabase upsert error:", error.message);
        } else {
          hasSynced.current = true;
        }
      } catch (err) {
        console.error("[useSyncUser] Unexpected error:", err);
      }
    };

    sync();
  }, [isSignedIn, user]);
}
