import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Play, Sparkles, Check, X, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { definitions, testQuestions } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/experiment")({
  validateSearch: (s: Record<string, unknown>) => ({ def: (s.def as string) ?? "def_net_revenue" }),
  component: ExperimentPage,
});

function ExperimentPage() {
  const { def: initial } = Route.useSearch();
  const [selected, setSelected] = useState(initial);
  const [openQ, setOpenQ] = useState<string | null>(null);
  const [askQ, setAskQ] = useState("");
  const [askResult, setAskResult] = useState<{ baseline: string; cm: string } | null>(null);
  const [asking, setAsking] = useState(false);

  const def = definitions.find((d) => d.id === selected) ?? definitions[0];
  const qs = testQuestions.filter((q) => q.definitionId === def.id);

  const scores = useMemo(() => {
    const baseline = qs.reduce((acc, q) => acc + q.baselinePass.filter(Boolean).length, 0);
    const cm = qs.reduce((acc, q) => acc + q.cmPass.filter(Boolean).length, 0);
    const total = qs.reduce((acc, q) => acc + q.criteria.length, 0);
    return { baseline, cm, total };
  }, [qs]);

  const improvement =
    scores.total > 0 ? Math.round(((scores.cm - scores.baseline) / scores.total) * 100) : 0;

  const tabs = definitions.slice(0, 6).map((d) => {
    const dqs = testQuestions.filter((q) => q.definitionId === d.id);
    const cm = dqs.reduce((acc, q) => acc + q.cmPass.filter(Boolean).length, 0);
    const tot = dqs.reduce((acc, q) => acc + q.criteria.length, 0);
    return { id: d.id, name: d.name, score: tot > 0 ? `${cm}/${tot}` : "—" };
  });

  const handleAsk = async () => {
    if (!askQ.trim()) return;
    setAsking(true);
    setAskResult(null);
    await new Promise((r) => setTimeout(r, 900));
    setAskResult({
      baseline:
        "Without specific company context, I'd interpret this in the most common sense. For example, revenue usually includes all income streams.",
      cm: `Based on the definition of ${def.name}: ${def.description}`,
    });
    setAsking(false);
  };

  return (
    <div>
      <PageHeader
        title="Experiment"
        description="Test whether AI understands your definitions."
        actions={
          <Button size="sm">
            <Play className="mr-1 h-3.5 w-3.5" />
            Run tests
          </Button>
        }
      />

      {/* Definition tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border px-8 py-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setSelected(t.id);
              setOpenQ(null);
              setAskResult(null);
            }}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              t.id === selected
                ? "bg-accent font-medium"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            {t.name}
            <span className="font-mono text-[11px] text-muted-foreground">{t.score}</span>
          </button>
        ))}
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-3 px-8 py-6">
        <ScoreCard label="Baseline" value={`${scores.baseline}/${scores.total}`} tone="bad" sub="Without definitions" />
        <ScoreCard label="With ClearMetric" value={`${scores.cm}/${scores.total}`} tone="good" sub="Definition injected" />
        <ScoreCard label="Improvement" value={`+${improvement}%`} tone="accent" sub="Accuracy gain" />
      </div>

      {/* Accuracy bar */}
      <div className="px-8">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Accuracy
        </div>
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
          {qs.flatMap((q, qi) =>
            q.cmPass.map((p, i) => (
              <div
                key={`${qi}-${i}`}
                className={cn("flex-1", p ? "bg-[var(--success)]" : "bg-destructive")}
              />
            )),
          )}
          {qs.length === 0 && <div className="flex-1 bg-muted" />}
        </div>
      </div>

      {/* Questions */}
      <div className="px-8 py-6">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Test questions
        </div>
        <div className="rounded-lg border border-border">
          {qs.map((q) => {
            const open = openQ === q.id;
            const bp = q.baselinePass.filter(Boolean).length;
            const cp = q.cmPass.filter(Boolean).length;
            return (
              <div key={q.id} className="border-b border-border last:border-b-0">
                <button
                  onClick={() => setOpenQ(open ? null : q.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
                >
                  <ChevronRight
                    className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-90")}
                  />
                  <span className="flex-1 text-sm">{q.question}</span>
                  <span className="font-mono text-xs text-destructive">{bp}/{q.criteria.length}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono text-xs text-[var(--success)]">{cp}/{q.criteria.length}</span>
                </button>
                {open && (
                  <div className="grid gap-4 bg-muted/30 px-10 py-5">
                    <div>
                      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Expected criteria
                      </div>
                      <ul className="space-y-1">
                        {q.criteria.map((c, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            {q.cmPass[i] ? (
                              <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-destructive" />
                            )}
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ResponsePanel label="Baseline" tone="bad" text={q.baselineResponse} />
                      <ResponsePanel label="With ClearMetric" tone="good" text={q.cmResponse} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {qs.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tests yet. Click <span className="font-medium text-foreground">Run tests</span> to auto-generate.
            </div>
          )}
        </div>
      </div>

      {/* Ask AI */}
      <div className="border-t border-border bg-muted/20 px-8 py-6">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Ask AI
        </div>
        <div className="flex gap-2">
          <Input
            value={askQ}
            onChange={(e) => setAskQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder={`Ask anything about ${def.name}…`}
            className="h-9"
          />
          <Button onClick={handleAsk} disabled={asking || !askQ.trim()} size="sm">
            <Send className="mr-1 h-3.5 w-3.5" />
            {asking ? "Asking…" : "Ask"}
          </Button>
        </div>
        {askResult && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ResponsePanel label="Baseline" tone="bad" text={askResult.baseline} />
            <ResponsePanel label="With ClearMetric" tone="good" text={askResult.cm} />
          </div>
        )}
      </div>

      {/* Coming soon */}
      <div className="mx-8 mb-8 mt-4 rounded-lg border-2 border-dashed border-border bg-transparent p-6 text-center opacity-60">
        <div className="text-sm font-medium">Live answer tests</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Run queries against your data to test end-to-end accuracy. Coming soon.
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "good" | "bad" | "accent";
}) {
  const toneClass =
    tone === "good"
      ? "text-[var(--success)]"
      : tone === "bad"
      ? "text-destructive"
      : "text-primary";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-2xl font-semibold tracking-tight tabular-nums", toneClass)}>{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ResponsePanel({ label, tone, text }: { label: string; tone: "good" | "bad"; text: string }) {
  const headerCls =
    tone === "good"
      ? "bg-[var(--success)]/10 text-[var(--success)]"
      : "bg-destructive/10 text-destructive";
  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div className={cn("px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider", headerCls)}>
        {label}
      </div>
      <div className="px-3 py-2.5 text-sm leading-relaxed">{text}</div>
    </div>
  );
}
