import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ticket, Star } from "lucide-react";
import { couponsQuery, bonusCouponsQuery } from "@/lib/queries";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";

export const Route = createFileRoute("/_app/coupons")({
  ssr: false,
  component: CouponsPage,
});

function CouponsPage() {
  useRealtimeInvalidate("coupons", [couponsQuery.queryKey]);
  useRealtimeInvalidate("bonus_coupons", [bonusCouponsQuery.queryKey]);

  const coupons = useQuery(couponsQuery);
  const bonuses = useQuery(bonusCouponsQuery);

  const rows = coupons.data ?? [];
  const bonusRows = bonuses.data ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total coupons awarded</div>
                <div className="text-2xl font-bold">{rows.length}</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              1 coupon per vehicle per day when daily diesel purchases total ≥ ₹500.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/20 text-accent">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Bonus coupons (7-day streaks)</div>
                <div className="text-2xl font-bold">{bonusRows.length}</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Awarded when a vehicle qualifies for 7 consecutive days.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Daily coupons</CardTitle>
          <CardDescription>Each row = one coupon (per vehicle, per day)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Total spent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">{r.day}</TableCell>
                  <TableCell className="font-mono text-xs">{r.vehicle_reg}</TableCell>
                  <TableCell>{r.entries_count}</TableCell>
                  <TableCell>₹{r.total_amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge>Coupon awarded</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {coupons.isLoading ? "Loading…" : "No coupons awarded yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" /> Bonus coupons
          </CardTitle>
          <CardDescription>Awarded on 7-day qualifying streaks</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Awarded on</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Reward</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonusRows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs text-muted-foreground">{b.streak_end_day}</TableCell>
                  <TableCell className="font-mono text-xs">{b.vehicle_reg}</TableCell>
                  <TableCell>
                    <Badge className="bg-accent text-accent-foreground">Bonus coupon</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {bonusRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                    {bonuses.isLoading ? "Loading…" : "No bonus coupons yet."}
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
