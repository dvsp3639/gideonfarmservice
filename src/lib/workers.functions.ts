import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/integrations/supabase/admin-middleware";

export type WorkerDTO = {
  id: string;
  username: string;
  display_name: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

function workerEmail(username: string) {
  const safe = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return `${safe}@workers.gideon.local`;
}

export const listWorkers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }): Promise<WorkerDTO[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "worker");
    if (rolesErr) throw new Error(rolesErr.message);
    const ids = roles?.map((r) => r.user_id) ?? [];
    if (ids.length === 0) return [];

    const { data: profs, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, phone, active, created_at")
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (profErr) throw new Error(profErr.message);
    return profs ?? [];
  });

export const createWorker = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data) =>
    z
      .object({
        username: z.string().min(3).max(40),
        display_name: z.string().min(1).max(80),
        phone: z.string().min(6).max(20).optional(),
        password: z.string().min(6).max(72),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = workerEmail(data.username);
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        username: data.username,
        display_name: data.display_name,
        phone: data.phone,
      },
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create user");

    // Ensure profile row (trigger handles it, but backfill for safety)
    await supabaseAdmin.from("profiles").upsert(
      {
        id: created.user.id,
        username: data.username,
        display_name: data.display_name,
        phone: data.phone,
        active: true,
      },
      { onConflict: "id" },
    );

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "worker" });
    if (roleErr) throw new Error(roleErr.message);

    return { id: created.user.id, email };
  });

export const updateWorker = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        display_name: z.string().min(1).max(80).optional(),
        phone: z.string().min(6).max(20).optional(),
        active: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const { error } = await supabaseAdmin.from("profiles").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetWorkerPassword = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data) => z.object({ id: z.string().uuid(), password: z.string().min(6).max(72) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWorker = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
