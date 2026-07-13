import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, ImageOff } from "lucide-react";
import { entriesQuery } from "@/lib/queries";
import type { EntryDTO } from "@/lib/entries.functions";
import { fmtDateTime } from "@/lib/format";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";
import { useSignedPhotoUrl } from "@/hooks/use-signed-photo";

export const Route = createFileRoute("/_app/entries")({
  ssr: false,
  component: EntriesPage,
});

function PhotoThumb({ path, onOpen }: { path: string | null; onOpen: (p: string | null) => void }) {
  const { data: url } = useSignedPhotoUrl(path);
  if (!path) {
    return (
      <div className="flex h-12 w-16 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }
  return (
    <button onClick={() => onOpen(path)}>
      {url ? (
        <img src={url} alt="vehicle" className="h-12 w-16 rounded-md object-cover ring-1 ring-border transition hover:ring-primary" />
      ) : (
        <div className="h-12 w-16 rounded-md bg-muted animate-pulse" />
      )}
    </button>
  );
}

function EntriesPage() {
  useRealtimeInvalidate("entries", [entriesQuery.queryKey]);
  const { data, isLoading } = useQuery(entriesQuery);
  const [q, setQ] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const { data: modalUrl } = useSignedPhotoUrl(photoPath);

  const filtered = useMemo<EntryDTO[]>(() => {
    const list = data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (e) =>
        e.driver_name.toLowerCase().includes(term) ||
        e.vehicle_reg.toLowerCase().includes(term) ||
        e.mobile.includes(term) ||
        e.worker_username.toLowerCase().includes(term),
    );
  }, [data, q]);

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
                    <PhotoThumb path={e.photo_path} onOpen={setPhotoPath} />
                  </TableCell>
                  <TableCell className="font-medium">{e.driver_name}</TableCell>
                  <TableCell className="font-mono text-xs">{e.vehicle_reg}</TableCell>
                  <TableCell className="text-muted-foreground">{e.mobile}</TableCell>
                  <TableCell>
                    <Badge variant={e.amount >= 500 ? "default" : "secondary"}>
                      ₹{e.amount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.worker_username}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDateTime(e.created_at)}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {isLoading ? "Loading entries…" : "No entries match your search."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!photoPath} onOpenChange={(o) => !o && setPhotoPath(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vehicle photo</DialogTitle>
          </DialogHeader>
          {modalUrl ? (
            <img src={modalUrl} alt="vehicle" className="w-full rounded-lg object-cover" />
          ) : (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
