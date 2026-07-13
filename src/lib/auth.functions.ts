import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MyProfile = {
  userId: string;
  username: string | null;
  display_name: string | null;
  isAdmin: boolean;
  isWorker: boolean;
};

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyProfile> => {
    const [{ data: profile }, { data: roles }] = await Promise.all([
      context.supabase.from("profiles").select("username, display_name").eq("id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    const roleSet = new Set((roles ?? []).map((r) => r.role));
    return {
      userId: context.userId,
      username: profile?.username ?? null,
      display_name: profile?.display_name ?? null,
      isAdmin: roleSet.has("admin"),
      isWorker: roleSet.has("worker"),
    };
  });

/**
 * If no admin exists yet, grant admin role to the currently signed-in user.
 * Idempotent no-op once an admin exists.
 */
export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) return { granted: false };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { granted: true };
  });

export const hasAnyAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw new Error(error.message);
  return { exists: (count ?? 0) > 0 };
});
