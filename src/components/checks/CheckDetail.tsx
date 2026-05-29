import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  Check as CheckIcon,
  ChevronRight,
  Database,
  ExternalLink,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { definitions } from "@/lib/mock-data";
import { useChecks } from "@/lib/referee/checks-store";
import { ToolResultCard } from "./ToolResultCard";
import { METADATA } from "@/lib/referee/mock-checks";
import { toast } from "sonner";

export function CheckDetail({ checkId }: { checkId: string | null }) {
  const { get, setStandard, acknowledge } = useChecks();
  const navigate = useNavigate();
  const [authorOpen, setAuthorOpen] = useState(false);
  const [authorText, setAuthorText] = useState("");

  const check = checkId ? get(checkId) : null;

  const standard = useMemo(
    () => (check?.definitionId ? definitions.find((d) => d.id === check.definitionId) : null),
    [check?.definitionId],
  );

  if (!check) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
        <FileText className="mb-3 h-7 w-7 text-muted-foreground/40" />
        <p className="text-sm">Select a check to inspect.</p>
        <p className="mt-1 text-xs">Deviations on the left are ranked by how often the question is asked.</p>
      </div>
    );
  }

  const deviantTokens = check.toolResults
    .filter((r) => r.verdict === "deviates")
    .flatMap((r) => extractDeviantTokens(r.deviationNote ?? ""));

  const fingerprintObjects = check.fingerprint
    .map((id) => METADATA.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-7 pb-20">
        {/* Question */}
        <h1 className="text-lg font-semibold tracking-tight">{check.questionText}</h1>
        <div className="mt-1.5 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <span>asked {check.frequencyScore}×/wk</span>
          <span>·</span>
          <span>
            {check.toolResults.length || "no"} tool
            {check.toolResults.length === 1 ? "" : "s"} answering
          </span>
        </div>

        {/* Cause / status banner */}
        {check.status === "deviating" && check.causeNote && (
          <div className="mt-5 flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground/85">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
            <div>
              <span className="font-medium text-destructive">Deviation. </span>
              {check.causeNote}
            </div>
          </div>
        )}

        {check.status === "no_standard" && (
          <div className="mt-5 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-foreground/85">
            <span className="font-medium text-warning">No standard. </span>
            Tools are answering this question without a governed definition to check against. Set one below.
          </div>
        )}

        {/* Standard */}
        {standard ? (
          <section className="mt-7">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Standard
              <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[9px] tracking-normal text-muted-foreground">
                from Define
              </span>
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              <div className="flex items-center gap-2.5 bg-muted/40 px-3 py-2">
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 truncate text-sm font-medium">{standard.name}</div>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {standard.owner}
                </span>
                <button
                  onClick={() =>
                    navigate({ to: "/define", search: { id: standard.id } })
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Open in Define"
                >
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <pre className="border-t border-border bg-background px-3 py-2.5 font-mono text-[11px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
                {standard.formula}
              </pre>
            </div>
          </section>
        ) : (
          <section className="mt-7 rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
            No standard set. Pick one below to start checking.
          </section>
        )}

        {/* Tool results */}
        {check.toolResults.length > 0 && (
          <section className="mt-6 space-y-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tool answers
            </div>
            {check.toolResults.map((r) => (
              <ToolResultCard
                key={r.tool}
                result={r}
                deviantTokens={r.verdict === "deviates" ? deviantTokens : []}
              />
            ))}
          </section>
        )}

        {/* Fingerprint */}
        {fingerprintObjects.length > 0 && (
          <section className="mt-7">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Dependency fingerprint
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fingerprintObjects.map((m) => (
                <span
                  key={m.id}
                  className="rounded-md bg-accent px-2 py-1 font-mono text-[10px] text-muted-foreground"
                >
                  {m.qualifiedName}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              This check re-runs only when one of these objects changes.
            </p>
          </section>
        )}

        {/* Set / change standard */}
        <section className="mt-8 border-t border-border pt-6">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {standard ? "Change standard" : "Set a standard"}
          </div>

          <SetStandardActions
            check={check}
            authorOpen={authorOpen}
            onAuthorOpen={() => {
              setAuthorOpen(true);
              setAuthorText("");
            }}
            onPickDefinition={(defId) => {
              setStandard(check.id, defId);
              toast.success("Standard set");
            }}
            onAdoptTool={(tool) => {
              const result = check.toolResults.find((r) => r.tool === tool);
              if (!result) return;
              acknowledge(check.id);
              toast.success(`Adopted ${tool} method as standard`);
            }}
          />

          {authorOpen && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={authorText}
                onChange={(e) => setAuthorText(e.target.value)}
                placeholder="-- Write the correct query that defines this metric."
                className="min-h-[100px] font-mono text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setAuthorOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAuthorOpen(false);
                    acknowledge(check.id);
                    toast.success("Standard authored");
                  }}
                  disabled={!authorText.trim()}
                >
                  Save as standard
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SetStandardActions({
  check,
  authorOpen,
  onAuthorOpen,
  onPickDefinition,
  onAdoptTool,
}: {
  check: ReturnType<typeof useChecks>["checks"][number];
  authorOpen: boolean;
  onAuthorOpen: () => void;
  onPickDefinition: (defId: string) => void;
  onAdoptTool: (tool: "cortex" | "copilot" | "genie") => void;
}) {
  const hasTools = check.toolResults.length > 0;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {/* Govern in Define */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="group flex items-center gap-2.5 rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-foreground/30 hover:bg-accent/50">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium">Govern in Define</div>
              <div className="truncate text-[10px] text-muted-foreground">
                Link to an existing definition
              </div>
            </div>
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
          {definitions
            .filter((d) => d.status === "tested")
            .slice(0, 25)
            .map((d) => (
              <DropdownMenuItem
                key={d.id}
                onClick={() => onPickDefinition(d.id)}
                className="text-xs"
              >
                <BookOpen className="mr-2 h-3 w-3 text-muted-foreground" />
                <span className="flex-1 truncate">{d.name}</span>
                <span className="ml-2 text-[10px] text-muted-foreground">
                  {d.domain}
                </span>
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Adopt a tool's method */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={!hasTools}
            className="group flex items-center gap-2.5 rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-foreground/30 hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium">Adopt a tool's method</div>
              <div className="truncate text-[10px] text-muted-foreground">
                {hasTools ? "Bless one tool's generated query" : "No tools have answered yet"}
              </div>
            </div>
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {check.toolResults.map((r) => (
            <DropdownMenuItem
              key={r.tool}
              onClick={() => onAdoptTool(r.tool)}
              className="text-xs"
            >
              <CheckIcon className="mr-2 h-3 w-3" />
              <span className="flex-1 capitalize">{r.tool}</span>
              <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                {r.returnedResult}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* From catalog (disabled — no catalog connected in v1) */}
      <button
        disabled
        className="flex items-center gap-2.5 rounded-md border border-dashed border-border bg-background p-3 text-left opacity-60"
      >
        <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium">From catalog</div>
          <div className="truncate text-[10px] text-muted-foreground">
            No catalog connected
          </div>
        </div>
      </button>

      {/* Author manually */}
      <button
        onClick={onAuthorOpen}
        disabled={authorOpen}
        className="group flex items-center gap-2.5 rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-foreground/30 hover:bg-accent/50 disabled:opacity-60"
      >
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium">Author manually</div>
          <div className="truncate text-[10px] text-muted-foreground">
            Write the correct query yourself
          </div>
        </div>
      </button>
    </div>
  );
}

/** Pull `quoted.identifiers` from a deviation note for highlighting. */
function extractDeviantTokens(note: string): string[] {
  const matches = note.match(/`([^`]+)`/g) ?? [];
  return matches.map((m) => m.replace(/`/g, ""));
}
