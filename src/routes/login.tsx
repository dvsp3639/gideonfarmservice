import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Fuel, Lock, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_EMAIL, hasAnyAdmin, provisionAdmin } from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [password, setPassword] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    hasAnyAdmin()
      .then((r) => setNeedsBootstrap(!r.exists))
      .catch(() => {});
  }, [navigate]);

  async function onGenerate() {
    setLoading(true);
    try {
      const { password: pw } = await provisionAdmin();
      setGenerated(pw);
      setPassword(pw);
      setNeedsBootstrap(false);
      toast.success("Admin created — save this password now");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create admin");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
      if (error) throw error;
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-gradient shadow-glow">
            <Fuel className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Gideon Farm Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">Admin Console · Diesel Reward Program</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <h2 className="text-lg font-semibold">Admin sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {needsBootstrap
              ? "No admin exists yet. Generate a one-time admin password to get started."
              : "Enter the admin password to continue."}
          </p>

          {needsBootstrap ? (
            <Button onClick={onGenerate} disabled={loading} className="mt-6 w-full font-semibold">
              <KeyRound className="mr-2 h-4 w-4" />
              {loading ? "Generating…" : "Generate admin password"}
            </Button>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {generated && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Save this password — it won't be shown again
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 break-all rounded bg-background px-2 py-1 text-sm">{generated}</code>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generated);
                        toast.success("Copied");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full font-semibold">
                {loading ? "Please wait…" : "Sign in"}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Gideon Farm Services
        </p>
      </div>
    </div>
  );
}
