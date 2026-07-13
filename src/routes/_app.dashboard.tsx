import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Droplet,
  IndianRupee,
  Ticket,
  Star,
  TrendingUp,
  Truck,
} from "lucide-react";
import { dashboardStatsQuery, entriesQuery } from "@/lib/queries";
import { fmtDateTime } from "@/lib/format";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";

export const Route = createFileRoute("/_app/dashboard")({
  ssr: false,
  component: DashboardPage,
});

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "bg-accent/20 text-accent"
      : tone === "warning"
        ? "bg-warning/20 text-warning"
        : tone === "muted"
          ? "bg-muted text-muted-foreground"
          : "bg-primary/20 text-primary";
  return (
    <Card className="shadow-card overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  useRealtimeInvalidate("entries", [dashboardStatsQuery.queryKey, entriesQuery.queryKey]);
  useRealtimeInvalidate("coupons", [dashboardStatsQuery.queryKey]);
  useRealtimeInvalidate("bonus_coupons", [dashboardStatsQuery.queryKey]);

  const stats = useQuery(dashboardStatsQuery);
  const entries = useQuery(entriesQuery);

  const week = stats.data?.weekly ?? [];
  const recent = (entries.data ?? []).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Droplet}
          label="Entries today"
          value={String(stats.data?.entriesToday ?? "—")}
          hint="Today"
          tone="primary"
        />
        <StatCard
          icon={IndianRupee}
          label="Sales this week"
          value={stats.data ? `₹${stats.data.salesWeek.toLocaleString("en-IN")}` : "—"}
          hint="7 days"
          tone="warning"
        />
        <StatCard
          icon={Ticket}
          label="Coupons awarded (week)"
          value={String(stats.data?.couponsWeek ?? "—")}
          hint={stats.data ? `${stats.data.couponsToday} today` : ""}
          tone="success"
        />
        <StatCard
          icon={Star}
          label="Bonus coupons (all-time)"
          value={String(stats.data?.bonusAllTime ?? "—")}
          hint="7-day streaks"
          tone="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Weekly sales
            </CardTitle>
            <CardDescription>Diesel sales over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={week}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Sales"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-accent" />
              Coupons per day
            </CardTitle>
            <CardDescription>Awarded in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="coupons" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Recent entries
          </CardTitle>
          <CardDescription>Latest autorickshaw purchases logged by workers</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.driver_name}</TableCell>
                  <TableCell className="font-mono text-xs">{e.vehicle_reg}</TableCell>
                  <TableCell>
                    <Badge variant={e.amount >= 500 ? "default" : "secondary"}>
                      ₹{e.amount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.worker_username}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {fmtDateTime(e.created_at)}
                  </TableCell>
                </TableRow>
              ))}
              {recent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {entries.isLoading ? "Loading…" : "No entries yet. Workers can start logging via the Android app."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
