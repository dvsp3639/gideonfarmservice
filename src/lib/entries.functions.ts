import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EntryDTO = {
  id: string;
  driver_name: string;
  vehicle_reg: string;
  mobile: string;
  amount: number;
  photo_path: string | null;
  worker_id: string;
  worker_username: string;
  worker_display_name: string | null;
  entry_day: string;
  created_at: string;
};

export const listEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EntryDTO[]> => {
    const { data: entries, error } = await context.supabase
      .from("entries")
      .select("id, driver_name, vehicle_reg, mobile, amount, photo_path, worker_id, entry_day, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    if (!entries || entries.length === 0) return [];

    const workerIds = [...new Set(entries.map((e) => e.worker_id))];
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", workerIds);
    const map = new Map(profiles?.map((p) => [p.id, p]) ?? []);
    return entries.map((e) => ({
      ...e,
      amount: Number(e.amount),
      worker_username: map.get(e.worker_id)?.username ?? "unknown",
      worker_display_name: map.get(e.worker_id)?.display_name ?? null,
    }));
  });
