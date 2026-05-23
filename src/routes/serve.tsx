import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppSidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { activityLog, REF_TS, definitions } from "@/lib/mock-data";
import { ChevronRight, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewCard, ReviewStrip } from "@/components/review-card";
import { suggestAliases, type AliasSuggestion } from "@/lib/engine";
import { toast } from "sonner";

export const Route = createFileRoute("/serve")({ component: ServePage });

function relTime(iso: string) {
  const diff = REF_TS - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type GroupBy = "none" | "agent" | "user";

function ServePage() {
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [agent, setAgent] = useState("all");
  const [user, setUser] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [aliasSugs, setAliasSugs] = useState<AliasSuggestion[]>([]);
  const dismissAlias = (id: string) =>
    setAliasSugs((prev) => prev.filter((s) => s.id !== id));

  const agents = useMemo(() => Array.from(new Set(activityLog.map((a) => a.agent))), []);
  const users = useMemo(() => Array.from(new Set(activityLog.map((a) => a.user))), []);

  const filtered = activityLog.filter(
    (a) => (agent === "all" || a.agent === agent) && (user === "all" || a.user === user),
  );

  const p50 = useMemo(() => {
    const sorted = [...activityLog.map((a) => a.latencyMs)].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }, []);

  // Today = last 24h from REF_TS
  const todayCount = useMemo(
    () =>
      activityLog.filter(
        (a) => REF_TS - new Date(a.ts).getTime() < 24 * 60 * 60 * 1000,
      ).length,
    [],
  );

  // Most Requested
  const mostRequested = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of activityLog) {
      if (!a.definitionName) continue;
      counts.set(a.definitionName, (counts.get(a.definitionName) ?? 0) + 1);
    }
    const arr = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const max = arr[0]?.count ?? 1;
    return { arr, max };
  }, []);

  // Never Requested: serveToAi=true but never appears in log
  const neverRequested = useMemo(() => {
    const requested = new Set(activityLog.map((a) => a.definitionName));
    return definitions
      .filter((d) => d.serveToAi && !requested.has(d.name))
      .slice(0, 8);
  }, []);

  const grouped = useMemo(() => {
    if (groupBy === "none") return [{ key: "", items: filtered }];
    const map = new Map<string, typeof filtered>();
    for (const a of filtered) {
      const k = groupBy === "agent" ? a.agent : a.user;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([key, items]) => ({ key, items }));
  }, [filtered, groupBy]);

  const summaryLine = `${activityLog.length} questions answered with governed definitions this week across ${agents.length} AI agents and ${users.length} users.`;

  return (
    <div className="flex h-screen flex-col">
      <PageHeader title="Serve" />

      {/* Section 1 — ROI summary */}
      <div className="border-b border-border bg-muted/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
          </span>
          <p className="flex-1 text-sm leading-relaxed text-foreground">{summaryLine}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(summaryLine);
              setCopiedSummary(true);
              setTimeout(() => setCopiedSummary(false), 1500);
            }}
            className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Copy summary"
          >
            {copiedSummary ? (
              <Check className="h-3.5 w-3.5 text-[var(--success)]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Section 2 — Stats row */}
      <div className="grid grid-cols-2 gap-px border-b border-border bg-border md:grid-cols-5">
        <StatCard label="Today" value={todayCount} />
        <StatCard label="This week" value={activityLog.length} />
        <StatCard label="Users" value={users.length} />
        <StatCard label="Agents" value={agents.length} />
        <StatCard label="p50 latency" value={`${p50}ms`} />
      </div>

      {/* Section 3 — Usage insights */}
      <div className="grid grid-cols-1 gap-px border-b border-border bg-border md:grid-cols-2">
        <div className="bg-background px-6 py-5">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Most requested
          </div>
          <ul className="space-y-1.5">
            {mostRequested.arr.map((d) => (
              <li key={d.name} className="flex items-center gap-3 text-xs">
                <span className="w-44 shrink-0 truncate">{d.name}</span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary/70"
                    style={{ width: `${(d.count / mostRequested.max) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                  {d.count}
                </span>
              </li>
            ))}
            {mostRequested.arr.length === 0 && (
              <li className="text-xs text-muted-foreground">No calls yet.</li>
            )}
          </ul>
        </div>
        <div className="bg-background px-6 py-5">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Never requested
          </div>
          <ul className="space-y-1.5">
            {neverRequested.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="truncate">{d.name}</span>
                <span className="shrink-0 rounded-full bg-[var(--warning,theme(colors.amber.500))]/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                  Unused
                </span>
              </li>
            ))}
            {neverRequested.length === 0 && (
              <li className="text-xs text-muted-foreground">
                Every served definition has been called at least once.
              </li>
            )}
          </ul>
          {neverRequested.length > 0 && (
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Consider renaming or checking if agents can find these definitions.
            </p>
          )}
        </div>
      </div>

      {/* Section 4 — Activity log */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Activity log
        </span>
        <div className="ml-auto flex items-center gap-2">
          <FilterSelect
            label="Group"
            value={groupBy}
            onChange={(v) => setGroupBy(v as GroupBy)}
            options={[
              { value: "none", label: "No grouping" },
              { value: "user", label: "By user" },
              { value: "agent", label: "By agent" },
            ]}
          />
          <FilterSelect
            label="User"
            value={user}
            onChange={setUser}
            options={[
              { value: "all", label: "All users" },
              ...users.map((u) => ({ value: u, label: u })),
            ]}
          />
          <FilterSelect
            label="Agent"
            value={agent}
            onChange={setAgent}
            options={[
              { value: "all", label: "All agents" },
              ...agents.map((a) => ({ value: a, label: a })),
            ]}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {/* Column headers */}
        <div className="grid grid-cols-[16px_72px_180px_180px_1fr_160px_56px] items-center gap-3 border-b border-border px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span />
          <span>Time</span>
          <span>User</span>
          <span>Agent</span>
          <span>Question · Definition</span>
          <span>Tool</span>
          <span className="text-right">ms</span>
        </div>
        {grouped.map((g) => (
          <div key={g.key || "all"} className="mb-4">
            {g.key && (
              <div className="sticky top-0 z-10 flex items-center gap-2 bg-background/95 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur">
                <span>{g.key}</span>
                <span className="text-muted-foreground/60">· {g.items.length}</span>
              </div>
            )}
            {g.items.map((a) => {
              const open = expanded === a.id;
              return (
                <div key={a.id} className="border-b border-border/60">
                  <button
                    onClick={() => setExpanded(open ? null : a.id)}
                    className="grid w-full cursor-pointer grid-cols-[16px_72px_180px_180px_1fr_160px_56px] items-center gap-3 px-2 py-2 text-left text-sm transition-colors hover:bg-accent/50"
                  >
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform",
                        open && "rotate-90",
                      )}
                    />
                    <span className="text-xs text-muted-foreground">{relTime(a.ts)}</span>
                    <span className="truncate text-xs text-muted-foreground">{a.user}</span>
                    <span className="truncate text-xs text-muted-foreground">{a.agent}</span>
                    <span className="truncate">
                      "{a.input}"
                      {a.definitionName && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          → {a.definitionName}
                        </span>
                      )}
                    </span>
                    <span className="truncate font-mono text-[11px] text-muted-foreground">
                      {a.tool}
                    </span>
                    <span className="text-right text-xs tabular-nums text-muted-foreground">
                      {a.latencyMs}
                    </span>
                  </button>
                  {open && (
                    <div className="grid grid-cols-[16px_1fr] gap-3 bg-muted/30 px-2 pb-4 pt-2 text-xs">
                      <div />
                      <div className="space-y-3">
                        <Meta
                          items={[
                            ["Definition served", a.definitionName ?? "— no match —"],
                            ["Tool called", a.tool],
                            ["Agent", a.agent],
                            ["User", a.user],
                          ]}
                        />
                        <div>
                          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Response returned to agent
                          </div>
                          <pre className="whitespace-pre-wrap rounded border border-border bg-background p-3 font-mono text-[11px] leading-relaxed">
{a.response}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No activity matches these filters.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-background px-5 py-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-[180px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Meta({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
      {items.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <span className="w-32 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
            {k}
          </span>
          <span className="truncate font-mono text-[11px]">{v}</span>
        </div>
      ))}
    </div>
  );
}
