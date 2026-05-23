import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Share2,
  FlaskConical,
  Pencil,
  ChevronDown,
  Filter,
  Users,
  Database,
  Layers,
  X,
  Sparkles,
  Zap,
  AlertTriangle,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { definitions as seedDefs, draftField, type Definition } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ReviewCard, ReviewStrip } from "@/components/review-card";
import {
  suggestDefinitionDrafts,
  suggestDriftAlerts,
  suggestImprovements,
  type Suggestion,
} from "@/lib/engine";

export const Route = createFileRoute("/define")({ component: DefinePage });

type GroupBy = "none" | "domain" | "owner" | "source" | "status";

function DefinePage() {
  const navigate = useNavigate();
  const [defs, setDefs] = useState<Definition[]>(seedDefs);
  const [query, setQuery] = useState("");
  const [owners, setOwners] = useState<Set<string>>(new Set());
  const [domains, setDomains] = useState<Set<string>>(new Set());
  const [servedOnly, setServedOnly] = useState(false);
  const [draftOnly, setDraftOnly] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>("domain");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafting, setDrafting] = useState<"description" | "formula" | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // Engine-produced suggestions queue. Seeded from current defs; dismissable.
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => [
    ...suggestDefinitionDrafts(),
    ...suggestDriftAlerts(seedDefs),
    ...suggestImprovements(seedDefs),
  ]);
  const dismissSuggestion = (id: string) =>
    setSuggestions((prev) => prev.filter((s) => s.id !== id));

  const runDraft = async (def: Definition, field: "description" | "formula") => {
    setDrafting(field);
    const next = await draftField(def, field);
    setDefs((prev) =>
      prev.map((d) =>
        d.id === def.id
          ? {
              ...d,
              [field]: next,
              ...(field === "formula" && d.driftFlag
                ? { driftFlag: false, driftNote: undefined, driftDate: undefined }
                : {}),
            }
          : d,
      ),
    );
    setDrafting(null);
  };

  // ⌘K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("def-search")?.focus();
      }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const allOwners = useMemo(() => Array.from(new Set(seedDefs.map((d) => d.owner))).sort(), []);
  const allDomains = useMemo(() => Array.from(new Set(seedDefs.map((d) => d.domain))).sort(), []);

  const filtered = defs.filter((d) => {
    const q = query.toLowerCase();
    if (q && !d.name.toLowerCase().includes(q) && !d.description.toLowerCase().includes(q)) return false;
    if (owners.size && !owners.has(d.owner)) return false;
    if (domains.size && !domains.has(d.domain)) return false;
    if (servedOnly && !d.serveToAi) return false;
    if (draftOnly && d.status !== "draft") return false;
    return true;
  });

  const grouped = useMemo(() => {
    if (groupBy === "none") return [{ key: "All", items: filtered }];
    const map = new Map<string, Definition[]>();
    for (const d of filtered) {
      const k = (d as any)[groupBy] as string;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(d);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, items]) => ({ key, items }));
  }, [filtered, groupBy]);

  const servedCount = defs.filter((d) => d.serveToAi).length;
  const draftCount = defs.filter((d) => d.status === "draft").length;
  const activeFilters = owners.size + domains.size + (servedOnly ? 1 : 0) + (draftOnly ? 1 : 0);

  const toggleServe = (id: string) =>
    setDefs((prev) => prev.map((d) => (d.id === id ? { ...d, serveToAi: !d.serveToAi } : d)));

  const toggleSet = (set: Set<string>, setSet: (s: Set<string>) => void, val: string) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setSet(next);
  };

  const selected = defs.find((d) => d.id === selectedId);

  // Bulk selection helpers
  const filteredIds = useMemo(() => filtered.map((d) => d.id), [filtered]);
  const allChecked = filteredIds.length > 0 && filteredIds.every((id) => checked.has(id));
  const someChecked = !allChecked && filteredIds.some((id) => checked.has(id));

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (allChecked) setChecked(new Set());
    else setChecked(new Set(filteredIds));
  };
  const clearChecked = () => setChecked(new Set());

  const bulkSetStatus = (status: Definition["status"]) => {
    setDefs((prev) => prev.map((d) => (checked.has(d.id) ? { ...d, status } : d)));
    toast.success(`${checked.size} marked as ${status === "tested" ? "approved" : "draft"}`);
    clearChecked();
  };
  const bulkSetServe = (serveToAi: boolean) => {
    setDefs((prev) => prev.map((d) => (checked.has(d.id) ? { ...d, serveToAi } : d)));
    toast.success(`${serveToAi ? "Exposed" : "Hidden from"} AI · ${checked.size} definitions`);
    clearChecked();
  };
  const bulkDelete = () => {
    const n = checked.size;
    setDefs((prev) => prev.filter((d) => !checked.has(d.id)));
    toast.success(`${n} definition${n === 1 ? "" : "s"} deleted`);
    clearChecked();
  };
  const bulkRedraft = async () => {
    setBulkBusy(true);
    const ids = Array.from(checked);
    const targets = defs.filter((d) => ids.includes(d.id));
    const drafts = await Promise.all(
      targets.map(async (d) => [d.id, await draftField(d, "description")] as const),
    );
    const map = new Map(drafts);
    setDefs((prev) =>
      prev.map((d) => (map.has(d.id) ? { ...d, description: map.get(d.id)! } : d)),
    );
    setBulkBusy(false);
    toast.success(`Re-drafted ${ids.length} description${ids.length === 1 ? "" : "s"}`);
    clearChecked();
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">Definitions</h1>
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {defs.length} · {servedCount} served · {draftCount} draft
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Share2 className="mr-1 h-3.5 w-3.5" />
            Share
          </Button>
          <Button size="sm" className="h-7 text-xs">
            <Plus className="mr-1 h-3.5 w-3.5" />
            New
          </Button>
        </div>
      </div>

      {/* Engine suggestion strip */}
      <ReviewStrip count={suggestions.length}>
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
                  dismissSuggestion(s.id);
                  toast.success(`${s.draft.name} added as draft`);
                }}
                onDismiss={() => dismissSuggestion(s.id)}
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
                  dismissSuggestion(s.id);
                }}
                onEdit={() => {
                  setSelectedId(s.definitionId);
                  dismissSuggestion(s.id);
                }}
                onDismiss={() => dismissSuggestion(s.id)}
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
                  dismissSuggestion(s.id);
                  toast.success("Description updated");
                }}
                onDismiss={() => dismissSuggestion(s.id)}
              >
                <span className="text-muted-foreground line-through">{s.before}</span>
                <span className="ml-1">→ {s.after}</span>
              </ReviewCard>
            );
          }
          return null;
        })}
      </ReviewStrip>

      {/* Toolbar */}
      <div className="flex h-11 items-center gap-1.5 border-b border-border bg-muted/20 px-6">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="def-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search definitions…"
            className="h-7 border-transparent bg-background pl-8 pr-12 text-xs shadow-none focus-visible:border-input"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-block">
            ⌘K
          </kbd>
        </div>

        <FilterMenu
          icon={<Users className="h-3.5 w-3.5" />}
          label="Owner"
          count={owners.size}
          options={allOwners}
          selected={owners}
          onToggle={(v) => toggleSet(owners, setOwners, v)}
          onClear={() => setOwners(new Set())}
        />
        <FilterMenu
          icon={<Layers className="h-3.5 w-3.5" />}
          label="Domain"
          count={domains.size}
          options={allDomains}
          selected={domains}
          onToggle={(v) => toggleSet(domains, setDomains, v)}
          onClear={() => setDomains(new Set())}
        />

        <Button
          variant={servedOnly ? "secondary" : "ghost"}
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setServedOnly((v) => !v)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Served
        </Button>
        <Button
          variant={draftOnly ? "secondary" : "ghost"}
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setDraftOnly((v) => !v)}
        >
          Draft
        </Button>

        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={() => {
              setOwners(new Set());
              setDomains(new Set());
              setServedOnly(false);
              setDraftOnly(false);
            }}
          >
            <X className="h-3 w-3" /> Clear
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Group by</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                {groupBy === "none" ? "None" : groupBy[0].toUpperCase() + groupBy.slice(1)}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["none", "domain", "owner", "source", "status"] as GroupBy[]).map((g) => (
                <DropdownMenuItem key={g} onClick={() => setGroupBy(g)}>
                  {g[0].toUpperCase() + g.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          {/* Sticky column header */}
          <div className="sticky top-0 z-10 grid grid-cols-[28px_1fr_180px_60px] items-center gap-3 border-b border-border bg-background/95 px-6 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
            <div className="flex items-center">
              <Checkbox
                checked={allChecked ? true : someChecked ? "indeterminate" : false}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </div>
            <div>Definition</div>
            <div>Owner</div>
            <div className="text-right">AI</div>
          </div>

          {grouped.map((g) => (
            <div key={g.key}>
              {groupBy !== "none" && (
                <div className="sticky top-9 z-[5] flex items-center gap-2 border-b border-border bg-muted/40 px-6 py-1.5 backdrop-blur">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {g.key}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{g.items.length}</span>
                </div>
              )}
              {g.items.map((d) => (
                <div
                  key={d.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(d.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(d.id);
                    }
                  }}
                  className={cn(
                    "grid w-full cursor-pointer grid-cols-[28px_1fr_180px_60px] items-center gap-3 border-b border-border/60 px-6 py-1.5 text-left transition-colors hover:bg-accent/50",
                    selectedId === d.id && "bg-accent",
                    checked.has(d.id) && "bg-accent/40",
                  )}
                  title={d.description}
                >
                  <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={checked.has(d.id)}
                      onCheckedChange={() => toggleCheck(d.id)}
                      aria-label={`Select ${d.name}`}
                    />
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        d.status === "tested" ? "bg-[var(--success)]" : "bg-muted-foreground/40",
                      )}
                      title={d.status === "tested" ? "Tested" : "Draft"}
                    />
                    <span className="truncate text-sm font-medium">{d.name}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {d.owner}
                    <span className="mx-1.5 opacity-40">·</span>
                    {d.domain}
                  </div>
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <Switch checked={d.serveToAi} onCheckedChange={() => toggleServe(d.id)} />
                  </div>
                </div>
              ))}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              No definitions match these filters.
            </div>
          )}
        </div>

        {/* Detail drawer */}
        {selected && (
          <aside className="w-[420px] shrink-0 overflow-y-auto border-l border-border bg-background">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate font-semibold">{selected.name}</span>
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {selected.domain}
                </Badge>
                <OriginBadge def={selected} />
              </div>
              <button
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setSelectedId(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selected.driftFlag && (
              <div className="flex items-start gap-2 border-b border-[var(--warning)]/40 bg-[var(--warning)]/10 px-5 py-2.5 text-xs">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning-foreground)]" />
                <div className="min-w-0 flex-1 leading-relaxed text-[var(--warning-foreground)]">
                  <span className="font-medium">Source changed {selected.driftDate}</span>
                  {selected.driftNote && (
                    <span className="ml-1 opacity-90">· {selected.driftNote}</span>
                  )}
                </div>
                <button
                  className="shrink-0 rounded border border-[var(--warning)]/50 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-background disabled:opacity-50"
                  onClick={() => runDraft(selected, "formula")}
                  disabled={drafting !== null}
                >
                  <Sparkles className="mr-1 inline h-3 w-3" />
                  Update formula
                </button>
              </div>
            )}

            <div className="space-y-5 px-5 py-4">
              <Field
                label="Description"
                action={
                  <DraftButton
                    busy={drafting === "description"}
                    onClick={() => runDraft(selected, "description")}
                  />
                }
              >
                <div className={cn("relative", drafting === "description" && "animate-pulse")}>
                  <p className="text-sm leading-relaxed">{selected.description}</p>
                </div>
              </Field>

              <Field
                label="Formula"
                action={
                  <DraftButton
                    busy={drafting === "formula"}
                    onClick={() => runDraft(selected, "formula")}
                  />
                }
              >
                <pre
                  className={cn(
                    "overflow-x-auto rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs whitespace-pre-wrap",
                    drafting === "formula" && "animate-pulse",
                  )}
                >
                  {selected.formula}
                </pre>
              </Field>


              <div className="grid grid-cols-2 gap-4">
                <Field label="Owner">
                  <span className="text-sm">{selected.owner}</span>
                </Field>
                <Field label="Source">
                  <span className="text-sm text-muted-foreground">{selected.source}</span>
                </Field>
                <Field label="Status">
                  <span className="text-sm">{selected.status === "tested" ? "Tested" : "Draft"}</span>
                </Field>
                <Field label="Confirmed">
                  <span className="text-sm text-muted-foreground">{selected.confirmedAt ?? "—"}</span>
                </Field>
              </div>

              <Field label="Used in">
                <div className="flex flex-wrap gap-1">
                  {selected.usedIn.map((u) => (
                    <Badge key={u} variant="outline" className="text-[10px] font-normal">
                      {u}
                    </Badge>
                  ))}
                </div>
              </Field>

              <Field label="Serve to AI">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selected.serveToAi}
                    onCheckedChange={() => toggleServe(selected.id)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {selected.serveToAi ? "Available via MCP" : "Not exposed"}
                  </span>
                </div>
              </Field>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Pencil className="mr-1 h-3 w-3" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Share2 className="mr-1 h-3 w-3" /> Share
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => navigate({ to: "/experiment", search: { def: selected.id } as never })}
                >
                  <FlaskConical className="mr-1 h-3 w-3" /> Test in Experiment
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Bulk action bar */}
      {checked.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 shadow-lg">
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs font-medium">{checked.size} selected</span>
              <button
                onClick={clearChecked}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
            <div className="mx-1 h-5 w-px bg-border" />

            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs"
              onClick={bulkRedraft}
              disabled={bulkBusy}
            >
              <Sparkles className={cn("h-3.5 w-3.5", bulkBusy && "animate-spin")} />
              {bulkBusy ? "Drafting…" : "Re-draft"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Status
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => bulkSetStatus("tested")} className="text-xs">
                  Mark as Approved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkSetStatus("draft")} className="text-xs">
                  Mark as Draft
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                  <Zap className="h-3.5 w-3.5" />
                  Serve
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => bulkSetServe(true)} className="text-xs">
                  Expose to AI
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkSetServe(false)} className="text-xs">
                  Hide from AI
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="mx-1 h-5 w-px bg-border" />

            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={bulkDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function DraftButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
      title="Draft with AI"
    >
      <Sparkles className={cn("h-3 w-3", busy && "animate-spin")} />
      {busy ? "Drafting…" : "Draft with AI"}
    </button>
  );
}

function OriginBadge({ def }: { def: Definition }) {
  if (def.driftFlag) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--warning-foreground)]">
        <AlertTriangle className="h-2.5 w-2.5" />
        Drifted
      </span>
    );
  }
  if (def.origin === "manual") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
        <Pencil className="h-2.5 w-2.5" />
        Manual
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
      <Zap className="h-2.5 w-2.5" />
      Auto
    </span>
  );
}



function FilterMenu({
  icon,
  label,
  count,
  options,
  selected,
  onToggle,
  onClear,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={count > 0 ? "secondary" : "ghost"}
          size="sm"
          className="h-7 gap-1 text-xs"
        >
          {icon}
          {label}
          {count > 0 && (
            <span className="ml-0.5 rounded bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between text-xs">
          {label}
          {count > 0 && (
            <button onClick={onClear} className="text-[11px] font-normal text-muted-foreground hover:text-foreground">
              clear
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o}
            checked={selected.has(o)}
            onCheckedChange={() => onToggle(o)}
            onSelect={(e) => e.preventDefault()}
            className="text-xs"
          >
            {o}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
