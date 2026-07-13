import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/integrations/supabase/admin-middleware";

export type DashboardStats = {
  entriesToday: number;
  salesWeek: number;
  couponsWeek: number;
  couponsToday: number;
  bonusAllTime: number;
  weekly: { date: string; label: string; entries: number; amount: number; coupons: number }[];
};

function istDay(d: Date): string {
  // format YYYY-MM-DD in Asia/Kolkata
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }): Promise<DashboardStats> => {
    const today = istDay(new Date());
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      days.push(istDay(d));
    }
    const weekStart = days[0];

    const [entriesRes, couponsRes, bonusRes] = await Promise.all([
      context.supabase
        .from("entries")
        .select("amount, entry_day")
        .gte("entry_day", weekStart)
        .limit(10000),
      context.supabase
        .from("coupons")
        .select("day")
        .gte("day", weekStart)
        .limit(10000),
      context.supabase.from("bonus_coupons").select("id", { count: "exact", head: true }),
    ]);
    if (entriesRes.error) throw new Error(entriesRes.error.message);
    if (couponsRes.error) throw new Error(couponsRes.error.message);
    if (bonusRes.error) throw new Error(bonusRes.error.message);

    const entries = entriesRes.data ?? [];
    const coupons = couponsRes.data ?? [];

    const weekly = days.map((iso) => {
      const dayEntries = entries.filter((e) => e.entry_day === iso);
      const dayCoupons = coupons.filter((c) => c.day === iso);
      const label = new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
        timeZone: "UTC",
        weekday: "short",
      });
      return {
        date: iso,
        label,
        entries: dayEntries.length,
        amount: dayEntries.reduce((s, e) => s + Number(e.amount), 0),
        coupons: dayCoupons.length,
      };
    });

    const entriesToday = entries.filter((e) => e.entry_day === today).length;
    const couponsToday = coupons.filter((c) => c.day === today).length;
    const salesWeek = weekly.reduce((s, d) => s + d.amount, 0);
    const couponsWeek = weekly.reduce((s, d) => s + d.coupons, 0);

    return {
      entriesToday,
      salesWeek,
      couponsWeek,
      couponsToday,
      bonusAllTime: bonusRes.count ?? 0,
      weekly,
    };
  });
