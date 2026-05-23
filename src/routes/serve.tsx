import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppSidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { activityLog } from "@/lib/mock-data";

export const Route = createFileRoute("/serve")({ component: ServePage });

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
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

  const today = activityLog.filter((a, i) => i < 12).length;
  const week = activityLog.length;
  const uniqueDefs = new Set(activityLog.map((a) => a.definitionName)).size;
  const p50 = (() => {
    const sorted = [...activityLog.map((a) => a.latencyMs)].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  })();

  return (
    <div>
      <PageHeader title="Serve" description="Live activity from AI assistants using your definitions." />

      <div className="grid grid-cols-4 gap-3 px-8 py-6">
        <Stat label="Calls today" value={today.toString()} />
        <Stat label="Calls this week" value={week.toString()} />
        <Stat label="Definitions served" value={uniqueDefs.toString()} sub="Unique" />
        <Stat label="Latency p50" value={`${p50}ms`} />
      </div>

      <div className="flex items-center gap-2 border-b border-border px-8 py-3">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Activity</div>
        <div className="ml-auto">
          <Select value={agent} onValueChange={setAgent}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
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

      <div className="px-8 py-2">
        <div className="grid grid-cols-[80px_140px_160px_1fr_160px_70px] items-center border-b border-border px-2 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <div>Time</div>
          <div>Agent</div>
          <div>Tool</div>
          <div>Input</div>
          <div>Definition</div>
          <div className="text-right">Latency</div>
        </div>
        {filtered.map((a) => (
          <div
            key={a.id}
            className="grid grid-cols-[80px_140px_160px_1fr_160px_70px] items-center border-b border-border px-2 py-2 text-sm transition-colors hover:bg-accent/50"
          >
            <div className="text-xs text-muted-foreground">{relTime(a.ts)}</div>
            <div className="truncate">{a.agent}</div>
            <div>
              <Badge variant="secondary" className="font-mono text-[10px] font-normal">
                {a.tool}
              </Badge>
            </div>
            <div className="truncate text-muted-foreground">"{a.input}"</div>
            <div className="truncate font-medium">{a.definitionName ?? "—"}</div>
            <div className="text-right font-mono text-xs tabular-nums text-muted-foreground">{a.latencyMs}ms</div>
          </div>
        ))}
      </div>
    </div>
  );
}
