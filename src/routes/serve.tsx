import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppSidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo, useState } from "react";
import { activityLog, REF_TS } from "@/lib/mock-data";

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

function ServePage() {
  const [agent, setAgent] = useState("all");
  const agents = useMemo(() => Array.from(new Set(activityLog.map((a) => a.agent))), []);
  const filtered = activityLog.filter((a) => agent === "all" || a.agent === agent);

  const p50 = useMemo(() => {
    const sorted = [...activityLog.map((a) => a.latencyMs)].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen flex-col">
        <PageHeader title="Serve" />

        {/* Pulse */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border px-6 py-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
            </span>
            <span className="font-medium">Live</span>
          </span>
          <Stat value={activityLog.length} label="calls this week" />
          <Stat value={agents.length} label="agents" />
          <Stat value={`${p50}ms`} label="p50 latency" />
        </div>

        {/* Activity */}
        <div className="flex items-center gap-2 px-6 py-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Recent activity
          </span>
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
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {filtered.map((a) => (
            <Tooltip key={a.id}>
              <TooltipTrigger asChild>
                <div className="grid cursor-default grid-cols-[80px_1fr_180px] items-center gap-3 border-b border-border/60 px-2 py-1.5 text-sm transition-colors hover:bg-accent/50">
                  <span className="text-xs text-muted-foreground">{relTime(a.ts)}</span>
                  <span className="truncate text-muted-foreground">"{a.input}"</span>
                  <span className="truncate">{a.definitionName ?? "—"}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {a.agent} · <span className="font-mono">{a.tool}</span> · {a.latencyMs}ms
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="font-mono text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
