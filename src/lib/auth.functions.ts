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
 * Idempotently ensure the built-in admin (username=admin) exists with the
 * fixed password. Safe to run repeatedly — creates the user + role on first
 * run and resets the password on subsequent runs.
 */
export const ensureAdminCredentials = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const password = "Sandeep@123";

  // Look up any existing user by synthetic email
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);
  const existing = list.users.find((u) => u.email === ADMIN_EMAIL);

  let userId: string;
  if (existing) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, { password });
    if (error) throw new Error(error.message);
    userId = existing.id;
  } else {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password,
      email_confirm: true,
      user_metadata: { username: "admin", display_name: "Admin" },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Failed to create admin");
    userId = created.user.id;
  }

  await supabaseAdmin.from("profiles").upsert(
    { id: userId, username: "admin", display_name: "Admin", active: true },
    { onConflict: "id" },
  );
  await supabaseAdmin.from("user_roles").upsert(
    { user_id: userId, role: "admin" },
    { onConflict: "user_id,role" },
  );

  return { ok: true, username: "admin" };
});
