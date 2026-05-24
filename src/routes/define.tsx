import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus,
  Search,
  AlertTriangle,
  X,
  Pencil,
  Filter,
  ArrowUpDown,
  Group,
  Check,
  ChevronRight,
  Trash2,
  MoreHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { definitions as seedDefs, type Definition } from "@/lib/mock-data";
import { matchesView } from "@/lib/views";
import { useViews } from "@/lib/views-store";
import { ViewEditor } from "@/components/view-editor";
import { toast } from "sonner";

type SortKey = "name" | "recent" | "drift" | "used";
type GroupKey = "none" | "domain" | "owner" | "status";

/* Mock AI generation — deterministic suggestions based on context */
function mockAiGenerate(field: "description" | "formula", def: Definition): string {
  if (field === "description") {
    if (!def.description.trim()) {
      return `Total ${def.name.toLowerCase()} across all recognized revenue streams, net of returns, discounts, and allowances, for the stated period.`;
    }
    return def.description + " Normalized for currency fluctuations and adjusted for non-recurring items.";
  }
  if (field === "formula") {
    if (!def.formula.trim()) {
      return `SUM(CASE WHEN recognized = true THEN amount ELSE 0 END) - returns - discounts`;
    }
    return def.formula + "\n-- validated against source-of-truth ledger monthly";
  }
  return "";
}

export const Route = createFileRoute("/define")({
  component: DefinePage,
  validateSearch: (s: Record<string, unknown>) => ({
    view: typeof s.view === "string" ? s.view : undefined,
    id: typeof s.id === "string" ? s.id : undefined,
  }),
});

function DefinePage() {
  const { view: viewId, id: selectedId } = Route.useSearch();
  const { views, upsert: upsertView } = useViews();
  const navigate = useNavigate();
  const activeView = views.find((v) => v.id === viewId) ?? null;

  const [defs, setDefs] = useState<Definition[]>(seedDefs);
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [groupKey, setGroupKey] = useState<GroupKey>("none");
  const [filterDrift, setFilterDrift] = useState(false);
  const [filterServed, setFilterServed] = useState(false);
  const [filterDomains, setFilterDomains] = useState<Set<string>>(new Set());
  const [filterOwners, setFilterOwners] = useState<Set<string>>(new Set());

  const allDomains = useMemo(
    () => Array.from(new Set(defs.map((d) => d.domain))).sort(),
    [defs],
  );
  const allOwners = useMemo(
    () => Array.from(new Set(defs.map((d) => d.owner))).sort(),
    [defs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = defs.filter((d) => {
      if (activeView && !matchesView(d, activeView)) return false;
      if (filterDrift && !d.driftFlag) return false;
      if (filterServed && !d.serveToAi) return false;
      if (filterDomains.size && !filterDomains.has(d.domain)) return false;
      if (filterOwners.size && !filterOwners.has(d.owner)) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.formula.toLowerCase().includes(q)
      );
    });
    const sorted = [...list].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "recent":
          return (b.confirmedAt ?? "").localeCompare(a.confirmedAt ?? "");
        case "drift":
          return Number(!!b.driftFlag) - Number(!!a.driftFlag);
        case "used":
          return b.usedIn.length - a.usedIn.length;
      }
    });
    return sorted;
  }, [
    defs,
    query,
    activeView,
    filterDrift,
    filterServed,
    filterDomains,
    filterOwners,
    sortKey,
  ]);

  const grouped = useMemo(() => {
    if (groupKey === "none") return [{ label: "", items: filtered }];
    const map = new Map<string, Definition[]>();
    for (const d of filtered) {
      const k =
        groupKey === "domain"
          ? d.domain
          : groupKey === "owner"
            ? d.owner
            : d.status;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(d);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, items]) => ({ label, items }));
  }, [filtered, groupKey]);

  const selected = defs.find((d) => d.id === selectedId) ?? null;

  // Auto-select first visible item if nothing selected
  useEffect(() => {
    if (!selected && filtered.length) {
      navigate({
        to: "/define",
        search: (prev: Record<string, unknown>) => ({ ...prev, id: filtered[0].id }),
        replace: true,
      });
    }
  }, [selected, filtered, navigate]);

  const select = (id: string) =>
    navigate({
      to: "/define",
      search: (prev: Record<string, unknown>) => ({ ...prev, id }),
      replace: true,
    });

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
    select(id);
  };

  const removeDef = (id: string) => {
    setDefs((prev) => prev.filter((d) => d.id !== id));
    navigate({ to: "/define", search: (prev: Record<string, unknown>) => ({ ...prev, id: undefined }) });
  };

  // Keyboard nav: / to focus search, j/k or arrows to move, e to focus name
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (e.key === "/" && !inField) {
        e.preventDefault();
        document.getElementById("def-search")?.focus();
        return;
      }
      if (inField) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const idx = filtered.findIndex((d) => d.id === selectedId);
        const next = filtered[Math.min(filtered.length - 1, idx + 1)];
        if (next) select(next.id);
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const idx = filtered.findIndex((d) => d.id === selectedId);
        const next = filtered[Math.max(0, idx - 1)];
        if (next) select(next.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, selectedId]);

  const filterCount =
    (filterDrift ? 1 : 0) +
    (filterServed ? 1 : 0) +
    filterDomains.size +
    filterOwners.size;

  const sortLabels: Record<SortKey, string> = {
    name: "Name",
    recent: "Recently edited",
    drift: "Drift first",
    used: "Most used",
  };
  const groupLabels: Record<GroupKey, string> = {
    none: "None",
    domain: "Domain",
    owner: "Owner",
    status: "Status",
  };

  const toggleSet = (
    set: Set<string>,
    setSet: (s: Set<string>) => void,
    v: string,
  ) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setSet(next);
  };

  return (
    <div className="flex h-screen min-w-0">
      {/* LIST PANE */}
      <div className="flex h-full w-[340px] shrink-0 flex-col border-r border-border">
        <div className="flex h-14 items-center gap-2 border-b border-border px-3">
          <h1 className="truncate text-sm font-semibold">
            {activeView ? activeView.name : "Definitions"}
          </h1>
          {activeView && (
            <button
              onClick={() =>
                navigate({ to: "/define", search: { id: selectedId } })
              }
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Exit view"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground">
            {filtered.length}
          </span>
          <button
            onClick={addBlank}
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="New definition  (N)"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="def-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…  /"
              className="h-8 border-transparent bg-muted/40 pl-8 text-xs shadow-none focus-visible:border-input"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 py-2">
          {/* Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground",
                  filterCount > 0 && "text-foreground",
                )}
              >
                <Filter className="h-3 w-3" />
                Filter
                {filterCount > 0 && (
                  <span className="rounded bg-primary/15 px-1 text-[10px] font-medium text-primary">
                    {filterCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-60 p-2">
              <div className="space-y-2 text-xs">
                <FilterToggle
                  label="Has drift"
                  checked={filterDrift}
                  onChange={setFilterDrift}
                />
                <FilterToggle
                  label="Served to AI"
                  checked={filterServed}
                  onChange={setFilterServed}
                />
                <FilterSection
                  label="Domain"
                  options={allDomains}
                  selected={filterDomains}
                  onToggle={(v) =>
                    toggleSet(filterDomains, setFilterDomains, v)
                  }
                />
                <FilterSection
                  label="Owner"
                  options={allOwners}
                  selected={filterOwners}
                  onToggle={(v) => toggleSet(filterOwners, setFilterOwners, v)}
                />
                {filterCount > 0 && (
                  <button
                    onClick={() => {
                      setFilterDrift(false);
                      setFilterServed(false);
                      setFilterDomains(new Set());
                      setFilterOwners(new Set());
                    }}
                    className="w-full rounded px-2 py-1 text-left text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground">
                <ArrowUpDown className="h-3 w-3" />
                {sortLabels[sortKey]}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Sort by
              </DropdownMenuLabel>
              {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                <DropdownMenuItem
                  key={k}
                  onClick={() => setSortKey(k)}
                  className="text-xs"
                >
                  <span className="flex-1">{sortLabels[k]}</span>
                  {sortKey === k && <Check className="h-3 w-3" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Group */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground">
                <Group className="h-3 w-3" />
                {groupKey === "none" ? "Group" : groupLabels[groupKey]}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Group by
              </DropdownMenuLabel>
              {(Object.keys(groupLabels) as GroupKey[]).map((k) => (
                <DropdownMenuItem
                  key={k}
                  onClick={() => setGroupKey(k)}
                  className="text-xs"
                >
                  <span className="flex-1">{groupLabels[k]}</span>
                  {groupKey === k && <Check className="h-3 w-3" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {activeView && (
            <button
              onClick={() => setEditorOpen(true)}
              className="ml-auto rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Edit view"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              No matches.
            </div>
          )}
          {grouped.map((g) => (
            <div key={g.label || "all"}>
              {g.label && (
                <div className="sticky top-0 z-10 bg-background/95 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
                  {g.label}
                  <span className="ml-1.5 text-muted-foreground/60">
                    {g.items.length}
                  </span>
                </div>
              )}
              {g.items.map((d) => {
                const active = d.id === selectedId;
                return (
                  <button
                    key={d.id}
                    onClick={() => select(d.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <span className="truncate">{d.name}</span>
                    {d.driftFlag && (
                      <AlertTriangle
                        className="h-3 w-3 shrink-0 text-amber-500"
                        aria-label="drift"
                      />
                    )}
                    <span className="ml-auto flex shrink-0 items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        {d.domain}
                      </span>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          d.serveToAi
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/30",
                        )}
                        title={d.serveToAi ? "Served to AI" : "Hidden from AI"}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL PANE */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        {selected ? (
          <DetailPane
            def={selected}
            onChange={(patch) => updateField(selected.id, patch)}
            onToggleServe={() => toggleServe(selected.id)}
            onDelete={() => removeDef(selected.id)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Select a definition
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
          navigate({ to: "/define", search: { view: v.id, id: selectedId } });
        }}
      />
    </div>
  );
}

function DetailPane({
  def,
  onChange,
  onToggleServe,
  onDelete,
}: {
  def: Definition;
  onChange: (patch: Partial<Definition>) => void;
  onToggleServe: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      {/* Header */}
      <div className="mb-6 flex items-start gap-2">
        <Input
          value={def.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="h-auto border-transparent bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:border-input focus-visible:ring-0"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mt-2 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={onDelete}
              className="text-xs text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick toggle */}
      <div className="mb-6 flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2">
        <div>
          <div className="text-xs font-medium">Serve to AI</div>
          <div className="text-[11px] text-muted-foreground">
            {def.serveToAi
              ? "Used by assistants and dashboards."
              : "Hidden from assistants."}
          </div>
        </div>
        <Switch checked={def.serveToAi} onCheckedChange={onToggleServe} />
      </div>

      {def.driftFlag && (
        <div className="mb-6 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <div>
            <div className="font-medium text-amber-700 dark:text-amber-400">
              Drift detected
            </div>
            <div className="text-muted-foreground">{def.driftNote}</div>
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-5">
        <Field label="Description">
          <Textarea
            value={def.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={3}
            className="text-sm"
          />
        </Field>
        <Field label="Formula">
          <Textarea
            value={def.formula}
            onChange={(e) => onChange({ formula: e.target.value })}
            rows={3}
            className="font-mono text-xs"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Meta label="Owner" value={def.owner} />
          <Meta label="Source" value={def.source} />
          <Meta label="Domain" value={def.domain} />
          <Meta
            label="Status"
            value={def.status === "tested" ? "Tested" : "Draft"}
          />
        </div>

        {def.usedIn.length > 0 && (
          <div>
            <FieldLabel>Used in</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {def.usedIn.map((u) => (
                <span
                  key={u}
                  className="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {u}
                </span>
              ))}
            </div>
          </div>
        )}

        {def.confirmedAt && (
          <div className="text-[11px] text-muted-foreground">
            Last confirmed {def.confirmedAt}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function FilterToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-accent"
    >
      <span>{label}</span>
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
}

function FilterSection({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  const [open, setOpen] = useState(selected.size > 0);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <ChevronRight
          className={cn("h-3 w-3 transition-transform", open && "rotate-90")}
        />
        {label}
        {selected.size > 0 && (
          <span className="ml-auto rounded bg-primary/15 px-1 text-[10px] font-medium text-primary">
            {selected.size}
          </span>
        )}
      </button>
      {open && (
        <div className="mt-0.5 max-h-40 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className="flex w-full items-center justify-between rounded px-2 py-1 text-xs hover:bg-accent"
            >
              <span className="truncate">{opt}</span>
              {selected.has(opt) && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
