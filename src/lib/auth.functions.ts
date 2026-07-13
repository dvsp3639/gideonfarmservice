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

export const ADMIN_EMAIL = "admin@workers.gideon.local";

export const hasAnyAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw new Error(error.message);
  return { exists: (count ?? 0) > 0 };
});

/**
 * First-run only: create the built-in admin user (username=admin) with a
 * randomly generated password and return it once for the user to save.
 * Fails if any admin already exists.
 */
export const provisionAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { count, error: countErr } = await supabaseAdmin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  if (countErr) throw new Error(countErr.message);
  if ((count ?? 0) > 0) throw new Error("Admin already exists");

  // Cryptographically random, human-readable password
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const password = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { username: "admin", display_name: "Admin" },
  });
  if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create admin");

  await supabaseAdmin.from("profiles").upsert(
    { id: created.user.id, username: "admin", display_name: "Admin", active: true },
    { onConflict: "id" },
  );

  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: created.user.id, role: "admin" });
  if (roleErr) throw new Error(roleErr.message);

  return { password };
});
