import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  FlaskConical,
  Radio,
  Moon,
  Sun,
  Sparkles,
  Settings,
  ChevronDown,
  Plus,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useViews } from "@/lib/views-store";
import { ViewEditor } from "@/components/view-editor";
import { CreditMeter } from "@/components/CreditMeter";
import { definitions } from "@/lib/mock-data";
import { useBilling, canSeeBilling } from "@/lib/billing-mock";
import type { View } from "@/lib/views";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/define", label: "Define", icon: BookOpen },
  { to: "/experiment", label: "Experiment", icon: FlaskConical },
  { to: "/serve", label: "Serve", icon: Radio },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search }) as {
    view?: string;
  };
  const navigate = useNavigate();
  const { role } = useBilling();
  const showBilling = canSeeBilling(role);
  const { theme, toggle } = useTheme();
  const { views, upsert, remove } = useViews();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<View | null>(null);
  const [groupOpen, setGroupOpen] = useState(true);

  const linkCls = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
    );

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (v: View) => {
    setEditing(v);
    setEditorOpen(true);
  };

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">ClearMetric</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = path === to || (to === "/define" && path === "/");
          return (
            <Link key={to} to={to} className={linkCls(active)}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}

        <div className="mt-4">
          <div className="flex items-center pr-1">
            <button
              onClick={() => setGroupOpen((v) => !v)}
              className="flex flex-1 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  !groupOpen && "-rotate-90",
                )}
              />
              My views
            </button>
            <button
              onClick={openNew}
              className="rounded p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              title="New view"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {groupOpen && (
            <div className="mt-0.5 space-y-0.5">
              {views.length === 0 && (
                <button
                  onClick={openNew}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                >
                  <Plus className="h-3 w-3" />
                  New view
                </button>
              )}
              {views.map((v) => {
                const active = path === "/define" && search.view === v.id;
                return (
                  <div
                    key={v.id}
                    className={cn(
                      "group flex items-center rounded-md",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <button
                      onClick={() =>
                        navigate({ to: "/define", search: { view: v.id } })
                      }
                      className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 text-left text-sm"
                    >
                      <Filter className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{v.name}</span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="mr-1 rounded p-1 opacity-0 hover:bg-sidebar-accent group-hover:opacity-100"
                          title="Options"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => openEdit(v)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            remove(v.id);
                            if (active) navigate({ to: "/define", search: {} });
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        <CreditMeter />
        <Link to="/pricing" className={linkCls(path === "/pricing")}>
          <Sparkles className="h-4 w-4" />
          Pricing
        </Link>
        <Link to="/settings" className={linkCls(path === "/settings")}>
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button onClick={toggle} className={linkCls(false) + " w-full"}>
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
      </div>

      <ViewEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        defs={definitions}
        initial={editing}
        onSave={(v) => {
          upsert(v);
          navigate({ to: "/define", search: { view: v.id } });
        }}
      />
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
