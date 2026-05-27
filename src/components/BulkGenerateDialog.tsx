import { useMemo, useState } from "react";
import { Database, Sparkles, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Definition } from "@/lib/mock-data";

type Source = {
  id: string;
  name: string;
  detail: string;
  tables: number;
  candidates: number;
};

const SOURCES: Source[] = [
  { id: "snowflake_sales", name: "Snowflake · sales", detail: "47 tables · last sync 12m ago", tables: 47, candidates: 38 },
  { id: "salesforce", name: "Salesforce", detail: "Opportunities, Accounts, Leads", tables: 12, candidates: 14 },
  { id: "postgres_events", name: "Postgres · events", detail: "Product analytics schema", tables: 23, candidates: 21 },
  { id: "powerbi", name: "Power BI · finance", detail: "9 published datasets", tables: 9, candidates: 11 },
];

const DOMAINS = ["Finance", "Sales", "Product", "Marketing", "CS"];

// Mock pool of names to materialize during streaming
const MOCK_NAMES = [
  "Pipeline Velocity", "Engaged Account", "Lead Conversion Rate", "Trial-to-Paid Rate",
  "Expansion MRR", "Logo Churn", "Average Deal Size", "Sales Cycle Length",
  "Activation Rate", "Time to First Value", "Weekly Active Accounts", "Feature Adoption",
  "Gross Margin", "CAC", "Magic Number", "Burn Multiple",
  "Support Ticket Volume", "First Response Time", "CSAT", "Renewal Rate",
];

const MOCK_DESCRIPTIONS: Record<string, string> = {
  "Pipeline Velocity":
    "Qualified pipeline ACV multiplied by win rate, divided by average sales cycle length. Measured per period.",
  "Engaged Account":
    "Account with 3 or more product events from 2 or more distinct users in the trailing 14 days. Excludes internal users.",
};

const CREDITS_PER_DRAFT = 10; // ~1 AI call per draft
const SECONDS_PER_DRAFT = 0.4;
const DEFAULT_MAX_CREDITS = 500;

export function BulkGenerateDialog({
  open,
  onOpenChange,
  onStart,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStart: (drafts: Definition[], totalSeconds: number) => void;
}) {
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set([SOURCES[0].id]));
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set(DOMAINS));
  const [skipExisting, setSkipExisting] = useState(true);
  const [maxCredits, setMaxCredits] = useState(DEFAULT_MAX_CREDITS);

  const estimate = useMemo(() => {
    const totalCandidates = SOURCES.filter((s) => selectedSources.has(s.id))
      .reduce((sum, s) => sum + s.candidates, 0);
    const domainFactor = selectedDomains.size / DOMAINS.length;
    const skipFactor = skipExisting ? 0.78 : 1;
    const expected = Math.max(0, Math.round(totalCandidates * domainFactor * skipFactor));
    // Honest range: ±25% — engine can't know exact count until it scans
    const low = Math.max(0, Math.floor(expected * 0.75));
    const high = Math.ceil(expected * 1.25);
    // Hard ceiling from user's credit budget
    const maxByCredits = Math.floor(maxCredits / CREDITS_PER_DRAFT);
    const cappedHigh = Math.min(high, maxByCredits);
    const cappedExpected = Math.min(expected, maxByCredits);
    const willCap = high > maxByCredits && maxByCredits > 0;
    return {
      low: Math.min(low, maxByCredits),
      high: cappedHigh,
      expected: cappedExpected,
      credits: cappedExpected * CREDITS_PER_DRAFT,
      seconds: Math.round(cappedExpected * SECONDS_PER_DRAFT),
      willCap,
    };
  }, [selectedSources, selectedDomains, skipExisting, maxCredits]);

  const toggle = (set: Set<string>, setSet: (s: Set<string>) => void, v: string) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setSet(next);
  };

  const handleStart = () => {
    const drafts: Definition[] = Array.from({ length: estimate.expected }).map((_, i) => {
      const name = MOCK_NAMES[i % MOCK_NAMES.length] + (i >= MOCK_NAMES.length ? ` ${Math.floor(i / MOCK_NAMES.length) + 1}` : "");
      const domains = Array.from(selectedDomains);
      const domain = domains[i % domains.length] ?? "Finance";
      const sourceIds = Array.from(selectedSources);
      const sourceName = SOURCES.find((s) => s.id === sourceIds[i % sourceIds.length])?.name ?? "Engine";
      return {
        id: `def_bulk_${Date.now()}_${i}`,
        name,
        description: MOCK_DESCRIPTIONS[name] ?? `Auto-drafted from ${sourceName}. Review the formula and exclusions before approving.`,
        formula: `-- auto-drafted from ${sourceName}\n-- review before serving to AI`,
        owner: "Engine",
        source: sourceName,
        domain,
        usedIn: [],
        confirmedAt: null,
        status: "draft" as const,
        serveToAi: false,
        origin: "auto" as const,
      };
    });
    onStart(drafts, estimate.seconds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate definitions from sources
          </DialogTitle>
          <DialogDescription className="text-xs">
            The engine scans connected sources and drafts a definition for each metric it finds.
            Drafts land in your library — nothing is served to AI until you approve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Sources */}
          <section>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Sources
            </div>
            <div className="space-y-1">
              {SOURCES.map((s) => {
                const checked = selectedSources.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(selectedSources, setSelectedSources, s.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition",
                      checked
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:bg-accent/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </div>
                    <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{s.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{s.detail}</div>
                    </div>
                    <div className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      ~{s.candidates} metrics
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Scope */}
          <section>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Scope
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DOMAINS.map((d) => {
                const on = selectedDomains.has(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggle(selectedDomains, setSelectedDomains, d)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] transition",
                      on
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent/50",
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Skip metrics already in the library
            </label>
          </section>

          {/* Budget */}
          <section>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Budget
            </div>
            <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-xs">
              <span className="text-muted-foreground">Stop after</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={CREDITS_PER_DRAFT}
                  step={CREDITS_PER_DRAFT}
                  value={maxCredits}
                  onChange={(e) => setMaxCredits(Math.max(CREDITS_PER_DRAFT, Number(e.target.value) || 0))}
                  className="w-20 rounded border border-border bg-background px-2 py-1 text-right text-xs tabular-nums focus:border-primary focus:outline-none"
                />
                <span className="text-muted-foreground">credits</span>
              </div>
            </label>
            {estimate.willCap && (
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                Budget will cap generation. Raise it to draft more.
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="flex !justify-between gap-3 border-t border-border pt-3 sm:items-center">
          <div className="text-[11px] tabular-nums text-muted-foreground">
            ~{estimate.low}–{estimate.high} drafts · up to {estimate.credits.toLocaleString()} credits
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleStart}
              disabled={estimate.expected === 0 || selectedSources.size === 0}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Generate drafts
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
