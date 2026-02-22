// server/middleware/verifyClerkToken.js
// Express middleware that:
//   1. Verifies the Clerk JWT from the Authorization header.
//   2. Looks up the user's role in app_users.
//   3. Attaches `req.clerkUserId` and `req.userRole` for downstream handlers.
//   4. Optionally enforces a list of allowed roles.

import { createClerkClient } from "@clerk/express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import "dotenv/config";

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
if (!clerkSecretKey) {
  throw new Error("Missing CLERK_SECRET_KEY in server environment.");
}

const clerk = createClerkClient({ secretKey: clerkSecretKey });

/**
 * Returns an Express middleware that:
 *  - Verifies the Clerk session token (Bearer <token>).
 *  - Fetches role from `app_users`.
 *  - Rejects with 401/403 if unauthenticated or role not in `allowedRoles`.
 *
 * Usage:
 *   router.post("/foo", verifyClerkToken(["admin","superadmin"]), handler);
 *   router.get("/bar", verifyClerkToken(),                       handler);   // any authenticated user
 */
export function verifyClerkToken(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
      }

      const token = authHeader.split(" ")[1];

      // Verify JWT with Clerk
      let payload;
      try {
        payload = await clerk.verifyToken(token);
      } catch (err) {
        console.error("[verifyClerkToken] Token verification failed:", err.message);
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      const clerkUserId = payload.sub;
      if (!clerkUserId) {
        return res.status(401).json({ error: "Token missing subject (sub)" });
      }

      // Look up role in Supabase
      const { data: userRow, error: dbError } = await supabaseAdmin
        .from("app_users")
        .select("role")
        .eq("clerk_user_id", clerkUserId)
        .single();

      if (dbError || !userRow) {
        console.error("[verifyClerkToken] User not found in app_users:", dbError?.message);
        return res.status(403).json({ error: "User not found in database" });
      }

      const role = userRow.role || "student";

      // Enforce allowed roles if specified
      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        console.warn(
          `[verifyClerkToken] Access denied for ${clerkUserId} (role=${role}), allowed=${allowedRoles}`
        );
        return res.status(403).json({ error: "Access denied: insufficient role" });
      }

      // Attach to request for downstream handlers
      req.clerkUserId = clerkUserId;
      req.userRole = role;
      next();
    } catch (err) {
      console.error("[verifyClerkToken] Unexpected error:", err);
      return res.status(500).json({ error: "Internal authentication error" });
    }
  };
}
