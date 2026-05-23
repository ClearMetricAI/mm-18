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
import { activityLog, REF_TS } from "@/lib/mock-data";
import { ChevronRight, Copy, Check } from "lucide-react";

const MCP_ENDPOINT = "https://mcp.clearmetric.ai/org_contoso/v1";
const MCP_KEY_MASKED = "cm_live_••••••••••••••••2f8a";
const MCP_KEY_FULL = "cm_live_full_key_redacted";

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
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const agents = useMemo(() => Array.from(new Set(activityLog.map((a) => a.agent))), []);
  const users = useMemo(() => Array.from(new Set(activityLog.map((a) => a.user))), []);

  const filtered = activityLog.filter(
    (a) => (agent === "all" || a.agent === agent) && (user === "all" || a.user === user),
  );

  const p50 = useMemo(() => {
    const sorted = [...activityLog.map((a) => a.latencyMs)].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
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

  return (
    <div className="flex h-screen flex-col">
      <PageHeader title="Serve" />

      {/* MCP endpoint */}
      <div className="space-y-1.5 border-b border-border bg-muted/20 px-6 py-3">
        <EndpointRow label="Endpoint" value={MCP_ENDPOINT} copied={copied === "url"} onCopy={() => copy("url", MCP_ENDPOINT)} />
        <EndpointRow label="API key" value={MCP_KEY_MASKED} copied={copied === "key"} onCopy={() => copy("key", MCP_KEY_FULL)} />
      </div>



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
        <Stat value={users.length} label="users" />
        <Stat value={agents.length} label="agents" />
        <Stat value={`${p50}ms`} label="p50 latency" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Recent activity
        </span>
        <div className="ml-auto flex items-center gap-2">
          <FilterSelect label="Group" value={groupBy} onChange={(v) => setGroupBy(v as GroupBy)} options={[
            { value: "none", label: "No grouping" },
            { value: "user", label: "By user" },
            { value: "agent", label: "By agent" },
          ]} />
          <FilterSelect label="User" value={user} onChange={setUser} options={[
            { value: "all", label: "All users" },
            ...users.map((u) => ({ value: u, label: u })),
          ]} />
          <FilterSelect label="Agent" value={agent} onChange={setAgent} options={[
            { value: "all", label: "All agents" },
            ...agents.map((a) => ({ value: a, label: a })),
          ]} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
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
                    className="grid w-full cursor-pointer grid-cols-[16px_72px_160px_1fr_160px_56px] items-center gap-3 px-2 py-2 text-left text-sm transition-colors hover:bg-accent/50"
                  >
                    <ChevronRight
                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
                    />
                    <span className="text-xs text-muted-foreground">{relTime(a.ts)}</span>
                    <span className="truncate text-xs text-muted-foreground">{a.user}</span>
                    <span className="truncate">"{a.input}"</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {a.agent}
                    </span>
                    <span className="text-right text-xs tabular-nums text-muted-foreground">
                      {a.latencyMs}ms
                    </span>
                  </button>
                  {open && (
                    <div className="grid grid-cols-[16px_1fr] gap-3 bg-muted/30 px-2 pb-4 pt-2 text-xs">
                      <div />
                      <div className="space-y-3">
                        <Meta items={[
                          ["Definition served", a.definitionName ?? "— no match —"],
                          ["Tool called", a.tool],
                          ["Agent", a.agent],
                          ["User", a.user],
                        ]} />
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
          <div className="py-12 text-center text-sm text-muted-foreground">No activity matches these filters.</div>
        )}
      </div>
    </div>
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
          <span className="w-32 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">{k}</span>
          <span className="truncate font-mono text-[11px]">{v}</span>
        </div>
      ))}
    </div>
  );
}
