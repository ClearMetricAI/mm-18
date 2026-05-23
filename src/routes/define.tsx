import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, FlaskConical, ChevronDown } from "lucide-react";
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

export const Route = createFileRoute("/define")({ component: DefinePage });

function DefinePage() {
  const navigate = useNavigate();
  const [defs, setDefs] = useState<Definition[]>(seedDefs);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => [
    ...suggestDefinitionDrafts(),
    ...suggestDriftAlerts(seedDefs),
    ...suggestImprovements(seedDefs),
  ]);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const dismiss = (id: string) =>
    setSuggestions((prev) => prev.filter((s) => s.id !== id));

  const approved = useMemo(() => {
    const q = query.trim().toLowerCase();
    return defs.filter(
      (d) =>
        !q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q),
    );
  }, [defs, query]);

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
    setOpenId(id);
  };

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col">
      {/* Header */}
      <header className="flex items-baseline justify-between px-6 pb-2 pt-8">
        <h1 className="text-xl font-semibold">Definitions</h1>
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground">{suggestions.length}</span> to review ·{" "}
          {defs.length} approved
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-16">
        {/* Inbox */}
        {suggestions.length > 0 && (
          <section className="space-y-2 pt-4">
            {suggestions.map((s) => {
              if (s.kind === "definition") {
                return (
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
                    <span className="text-muted-foreground">{s.draft.description}</span>
                  </ReviewCard>
                );
              }
              if (s.kind === "drift") {
                return (
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
                      setOpenId(s.definitionId);
                      dismiss(s.id);
                    }}
                    onDismiss={() => dismiss(s.id)}
                  >
                    <span className="font-mono text-[11px] text-muted-foreground">{s.note}</span>
                  </ReviewCard>
                );
              }
              if (s.kind === "improvement") {
                return (
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
                      toast.success("Description updated");
                    }}
                    onDismiss={() => dismiss(s.id)}
                  >
                    <span className="text-muted-foreground line-through">{s.before}</span>
                    <span className="ml-1">→ {s.after}</span>
                  </ReviewCard>
                );
              }
              return null;
            })}
          </section>
        )}

        {/* Library */}
        <section className="pt-8">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Approved
            </h2>
            <span className="text-[11px] text-muted-foreground">{approved.length}</span>
            <button
              onClick={addBlank}
              className="ml-auto rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="New definition"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-8 border-transparent bg-muted/40 pl-8 text-xs shadow-none focus-visible:border-input"
            />
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
                    <span className="truncate text-sm font-medium">{d.name}</span>
                    <span className="ml-auto flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-muted-foreground">
                        {d.serveToAi ? "Served" : "Hidden"}
                      </span>
                      <Switch
                        checked={d.serveToAi}
                        onCheckedChange={() => toggleServe(d.id)}
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
                      <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                        <span>
                          {d.owner} · {d.source}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() =>
                            navigate({
                              to: "/experiment",
                              search: { def: d.id } as never,
                            })
                          }
                        >
                          <FlaskConical className="mr-1 h-3 w-3" /> Test
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
        </section>
      </div>
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
