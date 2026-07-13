import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { mockWorkers, type Worker } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/workers")({
  component: WorkersPage,
});

type FormState = { username: string; fullName: string; phone: string; password: string; active: boolean };
const empty: FormState = { username: "", fullName: "", phone: "", password: "", active: true };

function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>(mockWorkers);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(w: Worker) {
    setEditing(w);
    setForm({ username: w.username, fullName: w.fullName, phone: w.phone, password: "", active: w.active });
    setOpen(true);
  }
  function save() {
    if (!form.username || !form.fullName || !form.phone) {
      toast.error("Please fill all required fields");
      return;
    }
    if (editing) {
      setWorkers((ws) =>
        ws.map((w) =>
          w.id === editing.id
            ? { ...w, username: form.username, fullName: form.fullName, phone: form.phone, active: form.active }
            : w,
        ),
      );
      toast.success("Worker updated");
    } else {
      if (!form.password) {
        toast.error("Password required for new worker");
        return;
      }
      setWorkers((ws) => [
        {
          id: crypto.randomUUID(),
          username: form.username,
          fullName: form.fullName,
          phone: form.phone,
          active: form.active,
          createdAt: new Date().toISOString(),
        },
        ...ws,
      ]);
      toast.success("Worker created — credentials issued");
    }
    setOpen(false);
  }
  function remove(w: Worker) {
    if (!confirm(`Delete worker "${w.username}"?`)) return;
    setWorkers((ws) => ws.filter((x) => x.id !== w.id));
    toast.success("Worker deleted");
  }
  function resetPassword(w: Worker) {
    const newPass = Math.random().toString(36).slice(2, 10);
    toast.success(`New password for ${w.username}: ${newPass}`, { duration: 8000 });
  }
  function toggleActive(w: Worker) {
    setWorkers((ws) => ws.map((x) => (x.id === w.id ? { ...x, active: !x.active } : x)));
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
                  <TableCell className="font-medium">{w.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{w.phone}</TableCell>
                  <TableCell>
                    <button onClick={() => toggleActive(w)}>
                      <Badge variant={w.active ? "default" : "secondary"}>
                        {w.active ? "Active" : "Disabled"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(w.createdAt).toLocaleDateString("en-IN")}
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
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. ravi.k" />
            </div>
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" />
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <Label>Password</Label>
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
            <Button onClick={save}>{editing ? "Save changes" : "Create worker"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
