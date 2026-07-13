import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "./auth-middleware";

/**
 * Enforces that the caller is signed in AND has the `admin` role.
 * Composes on top of requireSupabaseAuth so context.supabase / userId / claims
 * remain available to handlers.
 */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Forbidden: admin only");
    return next();
  });
