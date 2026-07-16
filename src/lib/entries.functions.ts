import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/integrations/supabase/admin-middleware";

export type EntryDTO = {
  id: string;
  driver_name: string;
  vehicle_reg: string;
  mobile: string;
  amount: number;
  photo_path: string | null;
  worker_id: string | null;
  worker_username: string;
  worker_display_name: string | null;
  entry_day: string;
  created_at: string;
};

export const listEntries = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }): Promise<EntryDTO[]> => {
    const { data: entries, error } = await context.supabase
      .from("entries")
      .select("id, driver_name, vehicle_reg, mobile, amount, photo_path, worker_id, entry_day, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    if (!entries || entries.length === 0) return [];

    const workerIds = [...new Set(entries.map((e) => e.worker_id).filter((id): id is string => id !== null))];
    const { data: profiles } = workerIds.length
      ? await context.supabase.from("profiles").select("id, username, display_name").in("id", workerIds)
      : { data: [] as { id: string; username: string; display_name: string | null }[] };
    const map = new Map(profiles?.map((p) => [p.id, p]) ?? []);
    return entries.map((e) => ({
      ...e,
      amount: Number(e.amount),
      worker_username: e.worker_id ? map.get(e.worker_id)?.username ?? "unknown" : "deleted",
      worker_display_name: e.worker_id ? map.get(e.worker_id)?.display_name ?? null : null,
    }));
  });
