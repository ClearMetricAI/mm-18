import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, ChevronDown, AlertTriangle, Sparkles, X, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { definitions as seedDefs, type Definition } from "@/lib/mock-data";
import { ReviewCard } from "@/components/review-card";
import {
  suggestDefinitionDrafts,
  suggestDriftAlerts,
  suggestImprovements,
  type Suggestion,
} from "@/lib/engine";
import { matchesView } from "@/lib/views";
import { useViews } from "@/lib/views-store";
import { ViewEditor } from "@/components/view-editor";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/define")({
  component: DefinePage,
  validateSearch: (s: Record<string, unknown>) => ({
    view: typeof s.view === "string" ? s.view : undefined,
  }),
});

type Tab = "inbox" | "library";

function DefinePage() {
  const { view: viewId } = Route.useSearch();
  const { views, upsert: upsertView } = useViews();
  const navigate = useNavigate();
  const activeView = views.find((v) => v.id === viewId) ?? null;

  const [defs, setDefs] = useState<Definition[]>(seedDefs);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => [
    ...suggestDefinitionDrafts(),
    ...suggestDriftAlerts(seedDefs),
    ...suggestImprovements(seedDefs),
  ]);
  const [tab, setTab] = useState<Tab>(activeView ? "library" : "inbox");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const dismiss = (id: string) =>
    setSuggestions((prev) => prev.filter((s) => s.id !== id));

  const drifts = suggestions.filter((s) => s.kind === "drift");
  const drafts = suggestions.filter((s) => s.kind === "definition");
  const improvements = suggestions.filter((s) => s.kind === "improvement");

  const approved = useMemo(() => {
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
    setDefs((prev) => prev.map((d) => (d.id === id ? { ...d, serveToAi: !d.serveToAi } : d)));

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
    setTab("library");
    setOpenId(id);
  };

  const inView = Boolean(activeView);

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
        {!inView && (
          <div className="mt-4 flex items-center gap-1 border-b border-border">
            <TabBtn active={tab === "inbox"} onClick={() => setTab("inbox")}>
              Inbox
              {suggestions.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {suggestions.length}
                </span>
              )}
            </TabBtn>
            <TabBtn active={tab === "library"} onClick={() => setTab("library")}>
              Library
              <span className="ml-1.5 text-[10px] text-muted-foreground">{defs.length}</span>
            </TabBtn>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-16">
        {!inView && tab === "inbox" && (
          <div className="space-y-6 pt-4">
            {drifts.length > 0 && (
              <SectionGroup
                icon={<AlertTriangle className="h-3 w-3" />}
                tone="warn"
                label="Drift"
              >
                {drifts.map((s) =>
                  s.kind === "drift" ? (
                    <ReviewCard
                      key={s.id}
                      kind={s.kind}
                      title={s.title}
                      rationale={s.rationale}
                      acceptLabel="Acknowledge"
                      onAccept={() => {
                        setDefs((prev) =>
                          prev.map((d) =>
                            d.id === s.definitionId
                              ? { ...d, driftFlag: false, driftNote: undefined, driftDate: undefined }
                              : d,
                          ),
                        );
                        dismiss(s.id);
                      }}
                      onEdit={() => {
                        setTab("library");
                        setOpenId(s.definitionId);
                        dismiss(s.id);
                      }}
                      onDismiss={() => dismiss(s.id)}
                    >
                      <span className="font-mono text-[11px] text-muted-foreground">{s.note}</span>
                    </ReviewCard>
                  ) : null,
                )}
              </SectionGroup>
            )}

            {drafts.length > 0 && (
              <SectionGroup
                icon={<Sparkles className="h-3 w-3" />}
                tone="brand"
                label="New drafts"
              >
                {drafts.map((s) =>
                  s.kind === "definition" ? (
                    <ReviewCard
                      key={s.id}
                      kind={s.kind}
                      title={s.title}
                      rationale={s.rationale}
                      onAccept={() => {
                        setDefs((prev) => [s.draft, ...prev]);
                        dismiss(s.id);
                        toast.success(`${s.draft.name} added`);
                      }}
                      onDismiss={() => dismiss(s.id)}
                    >
                      <div className="space-y-1.5">
                        <div className="text-muted-foreground">{s.draft.description}</div>
                        <pre className="overflow-x-auto rounded border border-border bg-muted/40 p-2 font-mono text-[10.5px] leading-relaxed text-foreground/80">
{s.draft.formula}
                        </pre>
                      </div>
                    </ReviewCard>
                  ) : null,
                )}
              </SectionGroup>
            )}

            {improvements.length > 0 && (
              <SectionGroup
                icon={<Sparkles className="h-3 w-3" />}
                tone="brand"
                label="Improvements"
              >
                {improvements.map((s) =>
                  s.kind === "improvement" ? (
                    <ReviewCard
                      key={s.id}
                      kind={s.kind}
                      title={s.title}
                      rationale={s.rationale}
                      onAccept={() => {
                        setDefs((prev) =>
                          prev.map((d) =>
                            d.id === s.definitionId ? { ...d, [s.field]: s.after } : d,
                          ),
                        );
                        dismiss(s.id);
                        toast.success("Updated");
                      }}
                      onDismiss={() => dismiss(s.id)}
                    >
                      <span className="text-muted-foreground line-through">{s.before}</span>
                      <span className="ml-1">→ {s.after}</span>
                    </ReviewCard>
                  ) : null,
                )}
              </SectionGroup>
            )}

            {suggestions.length === 0 && (
              <div className="rounded-md border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
                Inbox zero.
              </div>
            )}
          </div>
        )}

        {(inView || tab === "library") && (
          <div className="pt-4">
            {activeView && (
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {approved.length} of {defs.length}
                </span>
                <button
                  onClick={() => setEditorOpen(true)}
                  className="rounded p-1 hover:bg-accent hover:text-foreground"
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
              {approved.map((d) => {
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
                            onChange={(e) => updateField(d.id, { description: e.target.value })}
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
              {approved.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No matches.
                </li>
              )}
            </ul>
          </div>
        )}
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

function TabBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "-mb-px flex items-center border-b-2 px-3 py-2 text-sm transition-colors",
        active
          ? "border-foreground font-medium text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SectionGroup({
  icon,
  tone,
  label,
  children,
}: {
  icon: React.ReactNode;
  tone: "warn" | "brand";
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div
        className={cn(
          "mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider",
          tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-primary",
        )}
      >
        {icon}
        {label}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
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
