import { queryOptions } from "@tanstack/react-query";
import { listEntries } from "./entries.functions";
import { listCoupons, listBonusCoupons } from "./coupons.functions";
import { getDashboardStats } from "./dashboard.functions";
import { listWorkers } from "./workers.functions";
import { getMyProfile } from "./auth.functions";

export const entriesQuery = queryOptions({
  queryKey: ["entries"],
  queryFn: () => listEntries(),
});

export const couponsQuery = queryOptions({
  queryKey: ["coupons"],
  queryFn: () => listCoupons(),
});

export const bonusCouponsQuery = queryOptions({
  queryKey: ["bonus-coupons"],
  queryFn: () => listBonusCoupons(),
});

export const dashboardStatsQuery = queryOptions({
  queryKey: ["dashboard-stats"],
  queryFn: () => getDashboardStats(),
});

export const workersQuery = queryOptions({
  queryKey: ["workers"],
  queryFn: () => listWorkers(),
});

export const myProfileQuery = queryOptions({
  queryKey: ["me"],
  queryFn: () => getMyProfile(),
});
