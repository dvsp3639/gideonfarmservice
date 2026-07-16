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
      .select("id, issued_date, vehicle_registration, coupon_value, coupon_type")
      .neq("coupon_type", "BONUS")
      .order("issued_date", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return (data ?? []).map((c) => {
      const iso = c.issued_date ?? "";
      return {
        id: c.id,
        day: iso ? iso.slice(0, 10) : "",
        vehicle_reg: c.vehicle_registration ?? "",
        total_amount: Number(c.coupon_value ?? 0),
        entries_count: 0,
        awarded_at: iso,
      };
    });
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
