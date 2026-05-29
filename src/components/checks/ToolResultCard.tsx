import { cn } from "@/lib/utils";
import { TOOL_META, type ToolResult } from "@/lib/referee/types";

/** Diff highlight: marks tokens in `query` that appear in `deviantTokens`. */
function highlightDeviations(query: string, deviantTokens: string[]): React.ReactNode {
  if (deviantTokens.length === 0) return query;
  // Build a single regex that matches any token; preserve case-insensitive.
  const escaped = deviantTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = query.split(re);
  return parts.map((p, i) =>
    deviantTokens.some((t) => t.toLowerCase() === p.toLowerCase()) ? (
      <mark
        key={i}
        className="rounded-sm bg-destructive/15 px-0.5 text-destructive dark:bg-destructive/25"
      >
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function ToolResultCard({
  result,
  deviantTokens = [],
}: {
  result: ToolResult;
  deviantTokens?: string[];
}) {
  const meta = TOOL_META[result.tool];
  const ok = result.verdict === "conforms";

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold text-white",
            ok ? "bg-foreground/70" : "bg-destructive",
          )}
        >
          {meta.mark}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium">{meta.name}</div>
          <div className="truncate text-[10px] text-muted-foreground">
            {meta.lang} · {meta.vendor}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              ok
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive",
            )}
          >
            {ok ? "Conforms" : "Deviates"}
          </span>
          <span
            className={cn(
              "font-mono text-xs tabular-nums",
              ok ? "text-foreground" : "text-destructive font-semibold",
            )}
          >
            {result.returnedResult}
          </span>
        </div>
      </div>

      <pre className="border-t border-border bg-muted/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground/85 overflow-x-auto whitespace-pre-wrap">
        {highlightDeviations(result.returnedQuery, deviantTokens)}
      </pre>

      {result.deviationNote && (
        <div className="border-t border-border bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
          {result.deviationNote}
        </div>
      )}
    </div>
  );
}
