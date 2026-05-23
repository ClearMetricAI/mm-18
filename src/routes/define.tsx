import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, ChevronDown, AlertTriangle, X, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { definitions as seedDefs, type Definition } from "@/lib/mock-data";
import { matchesView } from "@/lib/views";
import { useViews } from "@/lib/views-store";
import { ViewEditor } from "@/components/view-editor";

export const Route = createFileRoute("/define")({
  component: DefinePage,
  validateSearch: (s: Record<string, unknown>) => ({
    view: typeof s.view === "string" ? s.view : undefined,
  }),
});

function DefinePage() {
  const { view: viewId } = Route.useSearch();
  const { views, upsert: upsertView } = useViews();
  const navigate = useNavigate();
  const activeView = views.find((v) => v.id === viewId) ?? null;

  const [defs, setDefs] = useState<Definition[]>(seedDefs);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return defs.filter((d) => {
      if (activeView && !matchesView(d, activeView)) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    });
  }, [defs, query, activeView]);

  const toggleServe = (id: string) =>
    setDefs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, serveToAi: !d.serveToAi } : d)),
    );

  const updateField = (id: string, patch: Partial<Definition>) =>
    setDefs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const addBlank = () => {
    const id = `def_new_${Date.now()}`;
    const d: Definition = {
      id,
      name: "Untitled",
      description: "",
      formula: "",
      owner: "You",
      source: "Manual",
      domain: "Finance",
      usedIn: [],
      confirmedAt: null,
      status: "draft",
      serveToAi: false,
      origin: "manual",
    };
    setDefs((prev) => [d, ...prev]);
    setOpenId(id);
  };

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col">
      <header className="px-6 pb-2 pt-8">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">
            {activeView ? activeView.name : "Definitions"}
          </h1>
          {activeView && (
            <button
              onClick={() => navigate({ to: "/define", search: {} })}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Exit view"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {activeView
            ? `${filtered.length} of ${defs.length} definitions`
            : `${defs.length} definitions`}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-16">
        <div className="pt-4">
          {activeView && (
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setEditorOpen(true)}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Edit filters"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="mb-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search definitions…"
                className="h-8 border-transparent bg-muted/40 pl-8 text-xs shadow-none focus-visible:border-input"
              />
            </div>
            <button
              onClick={addBlank}
              className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="New definition"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <ul className="divide-y divide-border rounded-md border border-border">
            {filtered.map((d) => {
              const open = openId === d.id;
              return (
                <li key={d.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenId(open ? null : d.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenId(open ? null : d.id);
                      }
                    }}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-accent/40"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                        !open && "-rotate-90",
                      )}
                    />
                    <span className="truncate text-sm">{d.name}</span>
                    {d.driftFlag && (
                      <span
                        className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400"
                        title={d.driftNote}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        drift
                      </span>
                    )}
                    <span className="ml-auto" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={d.serveToAi}
                        onCheckedChange={() => toggleServe(d.id)}
                        title={d.serveToAi ? "Served to AI" : "Hidden from AI"}
                      />
                    </span>
                  </div>
                  {open && (
                    <div className="space-y-3 border-t border-border bg-muted/20 px-9 py-3">
                      <Field label="Name">
                        <Input
                          value={d.name}
                          onChange={(e) => updateField(d.id, { name: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </Field>
                      <Field label="Description">
                        <Textarea
                          value={d.description}
                          onChange={(e) =>
                            updateField(d.id, { description: e.target.value })
                          }
                          rows={3}
                          className="text-sm"
                        />
                      </Field>
                      <Field label="Formula">
                        <Textarea
                          value={d.formula}
                          onChange={(e) => updateField(d.id, { formula: e.target.value })}
                          rows={2}
                          className="font-mono text-xs"
                        />
                      </Field>
                      <div className="flex justify-end pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setOpenId(null)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                No matches.
              </li>
            )}
          </ul>
        </div>
      </div>

      <ViewEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        defs={defs}
        initial={activeView}
        onSave={(v) => {
          upsertView(v);
          navigate({ to: "/define", search: { view: v.id } });
        }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
