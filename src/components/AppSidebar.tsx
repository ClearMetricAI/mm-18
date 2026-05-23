import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, FlaskConical, Radio, Moon, Sun, Sparkles, Settings } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/define", label: "Define", icon: BookOpen },
  { to: "/experiment", label: "Experiment", icon: FlaskConical },
  { to: "/serve", label: "Serve", icon: Radio },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();

  const linkCls = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
    );

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">ClearMetric</span>
      </div>

      <nav className="flex-1 px-2 py-2">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = path === to || (to === "/define" && path === "/");
          return (
            <Link key={to} to={to} className={linkCls(active)}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        <Link to="/settings" className={linkCls(path === "/settings")}>
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button onClick={toggle} className={linkCls(false) + " w-full"}>
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
      </div>
    </aside>
  );
}

export function PageHeader({
  title,
  meta,
  actions,
}: {
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-sm font-semibold">{title}</h1>
        {meta && <div className="truncate text-xs text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}
    </div>
  );
}
