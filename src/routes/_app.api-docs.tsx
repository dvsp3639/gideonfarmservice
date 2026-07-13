import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/api-docs")({
  component: ApiDocsPage,
});

type Endpoint = {
  method: "POST" | "GET" | "PUT" | "DELETE";
  path: string;
  desc: string;
  auth: "worker" | "admin" | "none";
  req?: string;
  res: string;
};

const endpoints: { group: string; items: Endpoint[] }[] = [
  {
    group: "Auth (Android app — workers)",
    items: [
      {
        method: "POST",
        path: "/api/auth/worker/login",
        auth: "none",
        desc: "Worker signs in from Android app. Returns bearer token to use in Authorization header.",
        req: `{
  "username": "ravi.k",
  "password": "••••••••"
}`,
        res: `{
  "token": "eyJhbGciOi...",
  "worker": {
    "id": "w1",
    "username": "ravi.k",
    "fullName": "Ravi Kumar"
  }
}`,
      },
      {
        method: "POST",
        path: "/api/auth/worker/logout",
        auth: "worker",
        desc: "Invalidate the worker's token.",
        res: `{ "ok": true }`,
      },
    ],
  },
  {
    group: "Entries (Android app)",
    items: [
      {
        method: "POST",
        path: "/api/entries",
        auth: "worker",
        desc: "Create a new diesel purchase entry. Send as multipart/form-data because a vehicle photo is included.",
        req: `Content-Type: multipart/form-data

driverName:      "Mahesh Yadav"
vehicleReg:      "MH12AB1234"
mobile:          "+919000000001"
amount:          500
photo:           <binary jpeg>
capturedAt:      "2026-07-13T10:15:00+05:30"   (optional)`,
        res: `{
  "id": "e123",
  "driverName": "Mahesh Yadav",
  "vehicleReg": "MH12AB1234",
  "mobile": "+919000000001",
  "amount": 500,
  "photoUrl": "https://cdn.example.com/entries/e123.jpg",
  "workerUsername": "ravi.k",
  "createdAt": "2026-07-13T10:15:00+05:30",
  "coupon": {
    "awardedToday": true,
    "dailyTotal": 500,
    "bonusAwarded": false,
    "streakDays": 3
  }
}`,
      },
      {
        method: "GET",
        path: "/api/entries/mine?date=YYYY-MM-DD",
        auth: "worker",
        desc: "List entries created by the logged-in worker (default: today).",
        res: `{ "entries": [ { "id": "e123", ... } ] }`,
      },
    ],
  },
  {
    group: "Coupons (Android app — optional driver lookup)",
    items: [
      {
        method: "GET",
        path: "/api/coupons/lookup?vehicleReg=MH12AB1234",
        auth: "worker",
        desc: "Check total coupons and current streak for a vehicle. Useful to show driver on-the-spot.",
        res: `{
  "vehicleReg": "MH12AB1234",
  "totalCoupons": 12,
  "bonusCoupons": 1,
  "currentStreak": 4,
  "todayTotal": 500,
  "qualifiedToday": true
}`,
      },
    ],
  },
  {
    group: "Admin — Workers CRUD (web dashboard)",
    items: [
      {
        method: "GET",
        path: "/api/admin/workers",
        auth: "admin",
        desc: "List all workers.",
        res: `{ "workers": [ { "id": "w1", "username": "ravi.k", "fullName": "...", "phone": "...", "active": true } ] }`,
      },
      {
        method: "POST",
        path: "/api/admin/workers",
        auth: "admin",
        desc: "Create a new worker credential.",
        req: `{
  "username": "ravi.k",
  "fullName": "Ravi Kumar",
  "phone": "+919812340001",
  "password": "••••••••",
  "active": true
}`,
        res: `{ "id": "w1", "username": "ravi.k", ... }`,
      },
      {
        method: "PUT",
        path: "/api/admin/workers/:id",
        auth: "admin",
        desc: "Update a worker's profile or active flag.",
        req: `{ "fullName": "...", "phone": "...", "active": false }`,
        res: `{ "id": "w1", ... }`,
      },
      {
        method: "POST",
        path: "/api/admin/workers/:id/reset-password",
        auth: "admin",
        desc: "Generate a new random password. The response is shown once.",
        res: `{ "password": "x8k2p9q1" }`,
      },
      {
        method: "DELETE",
        path: "/api/admin/workers/:id",
        auth: "admin",
        desc: "Delete a worker.",
        res: `{ "ok": true }`,
      },
    ],
  },
  {
    group: "Admin — Reports (web dashboard)",
    items: [
      {
        method: "GET",
        path: "/api/admin/entries?from=YYYY-MM-DD&to=YYYY-MM-DD&q=...",
        auth: "admin",
        desc: "List entries filtered by date range and search term.",
        res: `{ "entries": [ { "id": "e1", "photoUrl": "...", ... } ], "total": 42 }`,
      },
      {
        method: "GET",
        path: "/api/admin/stats/daily?date=YYYY-MM-DD",
        auth: "admin",
        desc: "Aggregated stats for one day.",
        res: `{
  "date": "2026-07-13",
  "entriesCount": 24,
  "totalSales": 12400,
  "couponsAwarded": 9,
  "bonusCouponsAwarded": 1
}`,
      },
      {
        method: "GET",
        path: "/api/admin/stats/weekly?weekStart=YYYY-MM-DD",
        auth: "admin",
        desc: "7-day aggregate for the dashboard chart.",
        res: `{ "days": [ { "date": "...", "entries": 0, "amount": 0, "coupons": 0 } ] }`,
      },
      {
        method: "GET",
        path: "/api/admin/coupons?from=YYYY-MM-DD&to=YYYY-MM-DD",
        auth: "admin",
        desc: "List coupon awards with vehicle + day breakdown.",
        res: `{ "coupons": [ { "day": "2026-07-13", "vehicleReg": "MH12AB1234", "total": 500, "count": 2 } ], "bonus": [ ... ] }`,
      },
    ],
  },
];

function MethodBadge({ m }: { m: Endpoint["method"] }) {
  const tone: Record<Endpoint["method"], string> = {
    GET: "bg-accent/20 text-accent",
    POST: "bg-primary/20 text-primary",
    PUT: "bg-chart-4/20 text-chart-4",
    DELETE: "bg-destructive/20 text-destructive",
  };
  return (
    <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${tone[m]}`}>{m}</span>
  );
}

function ApiDocsPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>API for your Android app</CardTitle>
          <CardDescription>
            Base URL: <span className="font-mono text-foreground">https://api.gideonfarm.example</span> · All requests
            (except worker login) require <span className="font-mono">Authorization: Bearer &lt;token&gt;</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground">Coupon rule</div>
            <div className="mt-1 text-foreground">≥ ₹500 diesel per vehicle per day = 1 coupon</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground">Bonus rule</div>
            <div className="mt-1 text-foreground">7 consecutive qualifying days = 1 bonus coupon</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground">Streak key</div>
            <div className="mt-1 text-foreground">Vehicle registration number</div>
          </div>
        </CardContent>
      </Card>

      {endpoints.map((group) => (
        <Card key={group.group} className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">{group.group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.items.map((ep) => (
              <div key={ep.path + ep.method} className="rounded-lg border border-border bg-background/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <MethodBadge m={ep.method} />
                  <code className="font-mono text-sm">{ep.path}</code>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    auth: {ep.auth}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{ep.desc}</p>
                {ep.req && (
                  <div className="mt-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Request
                    </div>
                    <pre className="overflow-x-auto rounded-md bg-background p-3 text-xs">
                      <code>{ep.req}</code>
                    </pre>
                  </div>
                )}
                <div className="mt-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Response 200
                  </div>
                  <pre className="overflow-x-auto rounded-md bg-background p-3 text-xs">
                    <code>{ep.res}</code>
                  </pre>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
