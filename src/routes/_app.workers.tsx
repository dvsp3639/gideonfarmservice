import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, KeyRound } from "lucide-react";
import { workersQuery } from "@/lib/queries";
import type { WorkerDTO } from "@/lib/workers.functions";
import {
  createWorker,
  updateWorker,
  deleteWorker,
  resetWorkerPassword,
} from "@/lib/workers.functions";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/workers")({
  ssr: false,
  component: WorkersPage,
});

type FormState = { username: string; display_name: string; password: string; active: boolean };
const empty: FormState = { username: "", display_name: "", password: "", active: true };

function WorkersPage() {
  const qc = useQueryClient();
  const { data: workers = [], isLoading } = useQuery(workersQuery);

  const createFn = useServerFn(createWorker);
  const updateFn = useServerFn(updateWorker);
  const deleteFn = useServerFn(deleteWorker);
  const resetFn = useServerFn(resetWorkerPassword);

  const invalidate = () => qc.invalidateQueries({ queryKey: workersQuery.queryKey });

  const createMut = useMutation({
    mutationFn: (data: { username: string; display_name: string; password: string }) =>
      createFn({ data }),
    onSuccess: () => {
      toast.success("Worker created");
      invalidate();
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create worker"),
  });
  const updateMut = useMutation({
    mutationFn: (data: { id: string; display_name?: string; active?: boolean }) =>
      updateFn({ data }),
    onSuccess: () => {
      toast.success("Worker updated");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Worker deleted");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const resetMut = useMutation({
    mutationFn: (v: { id: string; password: string }) => resetFn({ data: v }),
    onSuccess: (_r, v) =>
      toast.success(`New password set: ${v.password}`, { duration: 10000 }),
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkerDTO | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(w: WorkerDTO) {
    setEditing(w);
    setForm({
      username: w.username,
      display_name: w.display_name ?? "",
      phone: w.phone ?? "",
      password: "",
      active: w.active,
    });
    setOpen(true);
  }
  function save() {
    if (editing) {
      updateMut.mutate({
        id: editing.id,
        display_name: form.display_name,
        phone: form.phone,
        active: form.active,
      });
      setOpen(false);
      return;
    }
    if (!form.username || !form.display_name || !form.phone || !form.password) {
      toast.error("Please fill all required fields (min 6 char password)");
      return;
    }
    createMut.mutate({
      username: form.username,
      display_name: form.display_name,
      phone: form.phone,
      password: form.password,
    });
  }
  function remove(w: WorkerDTO) {
    if (!confirm(`Delete worker "${w.username}"? This removes their account permanently.`)) return;
    deleteMut.mutate(w.id);
  }
  function resetPassword(w: WorkerDTO) {
    const newPass = Math.random().toString(36).slice(2, 10);
    resetMut.mutate({ id: w.id, password: newPass });
  }
  function toggleActive(w: WorkerDTO) {
    updateMut.mutate({ id: w.id, active: !w.active });
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Workers</CardTitle>
            <CardDescription>Android app users — issue credentials and manage access</CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New worker
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Full name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs">{w.username}</TableCell>
                  <TableCell className="font-medium">{w.display_name}</TableCell>
                  <TableCell className="text-muted-foreground">{w.phone}</TableCell>
                  <TableCell>
                    <button onClick={() => toggleActive(w)}>
                      <Badge variant={w.active ? "default" : "secondary"}>
                        {w.active ? "Active" : "Disabled"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDate(w.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => resetPassword(w)} title="Reset password">
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(w)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(w)} title="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {workers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {isLoading ? "Loading workers…" : "No workers yet. Click “New worker” to create one."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit worker" : "New worker"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update details for this Android app user." : "Create credentials for a new Android app user."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. ravi.k"
                disabled={!!editing}
              />
              {!editing && (
                <p className="text-[11px] text-muted-foreground">
                  Sign-in email will be{" "}
                  <span className="font-mono">{(form.username || "username")}@workers.gideon.local</span>
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" />
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <Label>Password (min 6)</Label>
                <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-muted-foreground">Allow this worker to sign in to the Android app.</div>
              </div>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Save changes" : createMut.isPending ? "Creating…" : "Create worker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
