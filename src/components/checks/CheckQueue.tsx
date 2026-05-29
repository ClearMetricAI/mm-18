import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useChecks } from "@/lib/referee/checks-store";
import type { Check, CheckStatus } from "@/lib/referee/types";

type Tab = CheckStatus | "all";

const TABS: { id: Tab; label: string; tone: string }[] = [
  { id: "deviating", label: "Deviating", tone: "text-destructive" },
  { id: "no_standard", label: "No standard", tone: "text-warning" },
  { id: "conforming", label: "Conforming", tone: "text-success" },
  { id: "all", label: "All", tone: "text-muted-foreground" },
];

function StatusDot({ status }: { status: CheckStatus }) {
  return (
    <span
      className={cn(
        "h-1.5 w-1.5 shrink-0 rounded-full",
        status === "deviating" && "bg-destructive",
        status === "no_standard" && "bg-warning",
        status === "conforming" && "bg-success",
      )}
    />
  );
}

export function CheckQueue({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { counts, byStatus } = useChecks();
  const [tab, setTab] = useState<Tab>("deviating");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const base = byStatus(tab);
    const q = query.trim().toLowerCase();
    const filtered = q
      ? base.filter((c) => c.questionText.toLowerCase().includes(q))
      : base;
    return [...filtered].sort((a, b) => b.frequencyScore - a.frequencyScore);
  }, [byStatus, tab, query]);

  return (
    <div className="flex h-full w-[320px] shrink-0 flex-col border-r border-border">
      {/* Tabs */}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-border px-2 py-2">
        {TABS.map((t) => {
          const count =
            t.id === "all"
              ? counts.all
              : counts[t.id as CheckStatus];
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
                active
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <span>{t.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "font-mono text-[10px] tabular-nums",
                    active ? t.tone : "text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="shrink-0 border-b border-border px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="h-7 border-transparent bg-muted/40 pl-8 text-xs shadow-none focus-visible:border-input"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {list.length === 0 ? (
          <div className="px-3 py-10 text-center text-xs text-muted-foreground">
            Nothing here.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {list.map((c) => (
              <QueueRow
                key={c.id}
                check={c}
                selected={selectedId === c.id}
                onClick={() => onSelect(c.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function QueueRow({
  check,
  selected,
  onClick,
}: {
  check: Check;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
          selected ? "bg-accent" : "hover:bg-accent/50",
        )}
      >
        <StatusDot status={check.status} />
        <span className="min-w-0 flex-1 truncate text-xs">{check.questionText}</span>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">
          {check.frequencyScore}/wk
        </span>
      </button>
    </li>
  );
}
