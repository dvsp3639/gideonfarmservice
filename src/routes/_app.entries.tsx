import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { mockEntries } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/entries")({
  component: EntriesPage,
});

function EntriesPage() {
  const [q, setQ] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = [...mockEntries].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (!term) return base;
    return base.filter(
      (e) =>
        e.driverName.toLowerCase().includes(term) ||
        e.vehicleReg.toLowerCase().includes(term) ||
        e.mobile.includes(term) ||
        e.workerUsername.toLowerCase().includes(term),
    );
  }, [q]);

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Vehicle entries</CardTitle>
            <CardDescription>Search by driver, vehicle, mobile or worker</CardDescription>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Date & time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <button onClick={() => setPhoto(e.photoUrl)}>
                      <img
                        src={e.photoUrl}
                        alt={e.vehicleReg}
                        className="h-12 w-16 rounded-md object-cover ring-1 ring-border transition hover:ring-primary"
                      />
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{e.driverName}</TableCell>
                  <TableCell className="font-mono text-xs">{e.vehicleReg}</TableCell>
                  <TableCell className="text-muted-foreground">{e.mobile}</TableCell>
                  <TableCell>
                    <Badge variant={e.amount >= 500 ? "default" : "secondary"}>
                      ₹{e.amount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.workerUsername}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No entries match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!photo} onOpenChange={(o) => !o && setPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vehicle photo</DialogTitle>
          </DialogHeader>
          {photo && (
            <img src={photo} alt="vehicle" className="w-full rounded-lg object-cover" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
