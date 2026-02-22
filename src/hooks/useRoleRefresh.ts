import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabase";

/**
 * Companion hook for useUserRole.
 * On window-focus it re-fetches the user's role from `app_users`
 * and calls `onRoleChange(newRole)` when it differs from the value
 * it last saw. Attach this in any layout/page where you want the
 * role to "auto-refresh" after a super-admin changes it.
 *
 * Does NOT modify useUserRole.ts (as required).
 *
 * Usage:
 *   const { role } = useUserRole();              // existing hook
 *   useRoleRefresh((newRole) => {                 // add-on
 *     if (newRole !== role) window.location.reload();
 *   });
 */
export function useRoleRefresh(onRoleChange?: (role: string | null) => void) {
  const { userId } = useAuth();
  const lastRole = useRef<string | null>(null);

  const checkRole = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("app_users")
      .select("role")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[useRoleRefresh] Error:", error.message);
      return;
    }

    const freshRole = data?.role ?? null;

    if (lastRole.current !== null && freshRole !== lastRole.current) {
      onRoleChange?.(freshRole);
    }

    lastRole.current = freshRole;
  }, [userId, onRoleChange]);

  useEffect(() => {
    // Initial fetch so we have a baseline
    checkRole();

    const handleFocus = () => {
      checkRole();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [checkRole]);
}
