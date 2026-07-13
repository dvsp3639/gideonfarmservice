import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/integrations/supabase/admin-middleware";

export type CouponDTO = {
  id: string;
  day: string;
  vehicle_reg: string;
  total_amount: number;
  entries_count: number;
  awarded_at: string;
};
export type BonusCouponDTO = {
  id: string;
  vehicle_reg: string;
  streak_end_day: string;
  awarded_at: string;
};

export const listCoupons = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }): Promise<CouponDTO[]> => {
    const { data, error } = await context.supabase
      .from("coupons")
      .select("id, day, vehicle_reg, total_amount, entries_count, awarded_at")
      .order("day", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return (data ?? []).map((c) => ({ ...c, total_amount: Number(c.total_amount) }));
  });

export const listBonusCoupons = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }): Promise<BonusCouponDTO[]> => {
    const { data, error } = await context.supabase
      .from("bonus_coupons")
      .select("id, vehicle_reg, streak_end_day, awarded_at")
      .order("streak_end_day", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
