import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("gideon_auth_v1")) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

const titles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of your promotional program" },
  "/entries": { title: "Entries", subtitle: "All autorickshaw diesel purchases" },
  "/workers": { title: "Workers", subtitle: "Manage Android app users" },
  "/coupons": { title: "Coupons", subtitle: "Rewards awarded to drivers" },
  "/api-docs": { title: "API Docs", subtitle: "Endpoints for your Android app" },
};

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const meta = titles[pathname] ?? { title: "Gideon Farm", subtitle: "" };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-hero">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight">{meta.title}</h1>
              <p className="truncate text-xs text-muted-foreground">{meta.subtitle}</p>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
