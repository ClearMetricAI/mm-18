import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppSidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, Plus, ArrowRight, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  activityLog,
  unmatchedQueries,
  topDefinitions,
  REF_TS,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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

function relMinutes(min: number) {
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ServePage() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState("all");
  const [activityOpen, setActivityOpen] = useState(false);

  const agents = useMemo(() => Array.from(new Set(activityLog.map((a) => a.agent))), []);
  const filtered = activityLog.filter((a) => agent === "all" || a.agent === agent);

  const callsToday = 47;
  const callsWeek = activityLog.length * 7;
  const uniqueAgents = agents.length;
  const p50 = (() => {
    const sorted = [...activityLog.map((a) => a.latencyMs)].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  })();

  const maxAsk = Math.max(...topDefinitions.map((d) => d.count));
  const unmatchedTotal = unmatchedQueries.reduce((s, q) => s + q.count, 0);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen flex-col">
        <PageHeader title="Serve" />

        <div className="flex-1 overflow-y-auto">
          {/* Pulse — single line replaces 4 cards */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border px-6 py-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
              </span>
              <span className="font-medium">Live</span>
            </span>
            <PulseStat label="today" value={callsToday} unit="calls" />
            <PulseStat label="this week" value={callsWeek} unit="calls" />
            <PulseStat label="" value={uniqueAgents} unit="agents" />
            <PulseStat label="p50" value={p50} unit="ms" />
          </div>

          {/* Coverage gaps — the headline */}
          <section className="px-6 py-6">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <h2 className="text-sm font-semibold">Coverage gaps</h2>
                  <span className="text-[11px] text-muted-foreground">
                    {unmatchedQueries.length} queries · {unmatchedTotal} asks
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Questions AI agents asked that didn't match any served definition. Define these to
                  close the gap.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              {unmatchedQueries.map((u) => (
                <button
                  key={u.id}
                  onClick={() => navigate({ to: "/define" })}
                  className="group flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-accent/50"
                >
                  <span className="truncate text-sm">
                    <span className="text-muted-foreground">"</span>
                    {u.query}
                    <span className="text-muted-foreground">"</span>
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {u.count} ask{u.count === 1 ? "" : "s"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">
                      Last asked {relMinutes(u.lastAskedMinutesAgo)} by {u.agents.join(", ")}
                    </TooltipContent>
                  </Tooltip>
                  <span className="hidden shrink-0 text-[11px] text-muted-foreground md:inline">
                    {relMinutes(u.lastAskedMinutesAgo)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 shrink-0 px-2 text-[11px] opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Define
                  </Button>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>

          {/* Most-asked definitions */}
          <section className="px-6 py-6">
            <div className="mb-3">
              <h2 className="text-sm font-semibold">Most-asked definitions</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Where ClearMetric is earning its keep this week.
              </p>
            </div>
            <div className="space-y-1.5">
              {topDefinitions.map((d) => (
                <button
                  key={d.definitionId}
                  onClick={() =>
                    navigate({ to: "/experiment", search: { def: d.definitionId } as never })
                  }
                  className="grid w-full grid-cols-[180px_1fr_50px] items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/50"
                >
                  <span className="truncate text-sm">{d.definitionName}</span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(d.count / maxAsk) * 100}%` }}
                    />
                  </div>
                  <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {d.count}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Activity — collapsed by default */}
          <section className="border-t border-border">
            <div className="flex items-center gap-2 px-6 py-3">
              <button
                onClick={() => setActivityOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronDown
                  className={cn("h-3 w-3 transition-transform", !activityOpen && "-rotate-90")}
                />
                Raw activity · {activityLog.length}
              </button>
              {activityOpen && (
                <div className="ml-auto">
                  <Select value={agent} onValueChange={setAgent}>
                    <SelectTrigger className="h-7 w-[160px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All agents</SelectItem>
                      {agents.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {activityOpen && (
              <div className="px-6 pb-8">
                <div className="grid grid-cols-[90px_1fr_200px] items-center border-b border-border px-2 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <div>Time</div>
                  <div>Query</div>
                  <div>Definition</div>
                </div>
                {filtered.map((a) => (
                  <Tooltip key={a.id}>
                    <TooltipTrigger asChild>
                      <div className="grid cursor-default grid-cols-[90px_1fr_200px] items-center border-b border-border/60 px-2 py-1.5 text-sm transition-colors hover:bg-accent/50">
                        <div className="text-xs text-muted-foreground">{relTime(a.ts)}</div>
                        <div className="truncate text-muted-foreground">"{a.input}"</div>
                        <div className="truncate text-sm">{a.definitionName ?? "—"}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      <div className="space-y-0.5">
                        <div>
                          <span className="text-muted-foreground">Agent:</span> {a.agent}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tool:</span>{" "}
                          <span className="font-mono">{a.tool}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Latency:</span> {a.latencyMs}ms
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}

function PulseStat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="font-mono text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-muted-foreground">{unit}</span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </span>
  );
}
