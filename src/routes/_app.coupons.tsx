import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
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
import { mockEntries, computeCoupons } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/coupons")({
  component: CouponsPage,
});

function CouponsPage() {
  const { coupons, bonus, couponRows, bonusDetails } = useMemo(
    () => computeCoupons(mockEntries),
    [],
  );

  const rows = [...couponRows].sort((a, b) => (a.day < b.day ? 1 : -1));

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
                <div className="text-2xl font-bold">{coupons}</div>
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
                <div className="text-2xl font-bold">{bonus}</div>
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
                <TableRow key={`${r.day}-${r.vehicleReg}`}>
                  <TableCell className="text-xs text-muted-foreground">{r.day}</TableCell>
                  <TableCell className="font-mono text-xs">{r.vehicleReg}</TableCell>
                  <TableCell>{r.count}</TableCell>
                  <TableCell>₹{r.total.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge>Coupon awarded</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No coupons awarded yet.
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
              {bonusDetails.map((b, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground">{b.awardedOn}</TableCell>
                  <TableCell className="font-mono text-xs">{b.vehicleReg}</TableCell>
                  <TableCell>
                    <Badge className="bg-accent text-accent-foreground">Bonus coupon</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {bonusDetails.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                    No bonus coupons yet.
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
