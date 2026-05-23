import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Sparkles,
  Check,
  X,
  Send,
  Plus,
  Trash2,
  Pencil,
  Search,
  RotateCw,
  ChevronDown,
} from "lucide-react";
import { useMemo, useState } from "react";
import { definitions, testQuestions as seedQuestions, availableModels, type TestQuestion } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/experiment")({
  validateSearch: (s: Record<string, unknown>) => ({ def: (s.def as string) ?? "def_net_revenue" }),
  component: ExperimentPage,
});

function ExperimentPage() {
  const { def: initial } = Route.useSearch();
  const [selected, setSelected] = useState(initial);
  const [defQuery, setDefQuery] = useState("");
  const [questions, setQuestions] = useState<TestQuestion[]>(seedQuestions);
  const [openQ, setOpenQ] = useState<string | null>(null);
  const [editingQ, setEditingQ] = useState<string | null>(null);
  const [model, setModel] = useState(availableModels[0]);
  const [running, setRunning] = useState<string | null>(null); // question id being re-run, or "all"

  const def = definitions.find((d) => d.id === selected) ?? definitions[0];
  const qs = questions.filter((q) => q.definitionId === def.id);

  const filteredDefs = useMemo(() => {
    const q = defQuery.toLowerCase();
    return definitions.filter((d) => !q || d.name.toLowerCase().includes(q));
  }, [defQuery]);

  const scores = useMemo(() => {
    const baseline = qs.reduce((acc, q) => acc + q.baselinePass.filter(Boolean).length, 0);
    const cm = qs.reduce((acc, q) => acc + q.cmPass.filter(Boolean).length, 0);
    const total = qs.reduce((acc, q) => acc + q.criteria.length, 0);
    return { baseline, cm, total };
  }, [qs]);

  const improvement =
    scores.total > 0 ? Math.round(((scores.cm - scores.baseline) / scores.total) * 100) : 0;

  const addQuestion = () => {
    const q: TestQuestion = {
      id: `q_new_${Date.now()}`,
      definitionId: def.id,
      question: "New question",
      criteria: ["New criterion"],
      baselineResponse: "(not run yet)",
      cmResponse: "(not run yet)",
      baselinePass: [false],
      cmPass: [false],
    };
    setQuestions((prev) => [...prev, q]);
    setOpenQ(q.id);
    setEditingQ(q.id);
  };

  const deleteQuestion = (id: string) => setQuestions((prev) => prev.filter((q) => q.id !== id));

  const updateQuestion = (id: string, patch: Partial<TestQuestion>) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const runAll = async () => {
    setRunning("all");
    await new Promise((r) => setTimeout(r, 1200));
    setRunning(null);
  };

  const runOne = async (id: string) => {
    setRunning(id);
    await new Promise((r) => setTimeout(r, 800));
    setRunning(null);
  };

  return (
    <div className="flex h-screen">
      {/* Left: scalable definition list */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-muted/20">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Definitions
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground">{definitions.length}</span>
        </div>
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={defQuery}
              onChange={(e) => setDefQuery(e.target.value)}
              placeholder="Find…"
              className="h-7 border-transparent bg-background pl-8 text-xs shadow-none focus-visible:border-input"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {filteredDefs.map((d) => {
            const dqs = seedQuestions.filter((q) => q.definitionId === d.id);
            const cm = dqs.reduce((a, q) => a + q.cmPass.filter(Boolean).length, 0);
            const tot = dqs.reduce((a, q) => a + q.criteria.length, 0);
            const isActive = d.id === selected;
            return (
              <button
                key={d.id}
                onClick={() => {
                  setSelected(d.id);
                  setOpenQ(null);
                  setEditingQ(null);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <span className="truncate flex-1">{d.name}</span>
                {tot > 0 ? (
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums",
                      cm === tot ? "text-[var(--success)]" : cm === 0 ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {cm}/{tot}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 min-w-0 flex-col">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold">{def.name}</h1>
              <Badge variant="secondary" className="text-[10px] font-normal">
                {def.domain}
              </Badge>
            </div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">{def.description}</div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-7 w-[150px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-7 text-xs" onClick={runAll} disabled={running === "all"}>
              {running === "all" ? (
                <RotateCw className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="mr-1 h-3.5 w-3.5" />
              )}
              {running === "all" ? "Running…" : "Run all"}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Score row */}
          <div className="grid grid-cols-3 gap-3 px-6 py-5">
            <ScoreCard label="Without ClearMetric" value={`${scores.baseline}/${scores.total}`} tone="bad" />
            <ScoreCard label="With ClearMetric" value={`${scores.cm}/${scores.total}`} tone="good" />
            <ScoreCard label="Improvement" value={scores.total === 0 ? "—" : `+${improvement}%`} tone="accent" />
          </div>

          <div className="px-6">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Accuracy across all criteria
            </div>
            <div className="flex h-1.5 gap-px overflow-hidden rounded-full bg-muted">
              {qs.flatMap((q, qi) =>
                q.cmPass.map((p, i) => (
                  <div
                    key={`${qi}-${i}`}
                    className={cn("flex-1", p ? "bg-[var(--success)]" : "bg-destructive")}
                  />
                )),
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="px-6 py-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Test questions · {qs.length}
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={addQuestion}>
                <Plus className="mr-1 h-3 w-3" /> Add question
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              {qs.map((q) => {
                const open = openQ === q.id;
                const editing = editingQ === q.id;
                const bp = q.baselinePass.filter(Boolean).length;
                const cp = q.cmPass.filter(Boolean).length;
                return (
                  <div key={q.id} className="border-b border-border last:border-b-0">
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 transition-colors",
                        open ? "bg-muted/40" : "hover:bg-accent/40 cursor-pointer",
                      )}
                      onClick={() => !editing && setOpenQ(open ? null : q.id)}
                    >
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                          !open && "-rotate-90",
                        )}
                      />
                      <span className="flex-1 truncate text-sm">{q.question}</span>
                      <ScorePill pass={bp} total={q.criteria.length} tone="bad" />
                      <span className="text-muted-foreground">→</span>
                      <ScorePill pass={cp} total={q.criteria.length} tone="good" />
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                          onClick={() => runOne(q.id)}
                          title="Re-run"
                        >
                          {running === q.id ? (
                            <RotateCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCw className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                          onClick={() => {
                            setOpenQ(q.id);
                            setEditingQ(editing ? null : q.id);
                          }}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteQuestion(q.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="space-y-4 border-t border-border bg-background px-10 py-4">
                        {editing ? (
                          <div className="space-y-3">
                            <Field label="Question">
                              <Textarea
                                value={q.question}
                                onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                                className="min-h-[60px] text-sm"
                              />
                            </Field>
                            <Field label="Expected criteria">
                              <div className="space-y-1.5">
                                {q.criteria.map((c, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <Input
                                      value={c}
                                      onChange={(e) => {
                                        const next = [...q.criteria];
                                        next[i] = e.target.value;
                                        updateQuestion(q.id, { criteria: next });
                                      }}
                                      className="h-7 text-xs"
                                    />
                                    <button
                                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => {
                                        const next = q.criteria.filter((_, j) => j !== i);
                                        updateQuestion(q.id, {
                                          criteria: next,
                                          baselinePass: q.baselinePass.filter((_, j) => j !== i),
                                          cmPass: q.cmPass.filter((_, j) => j !== i),
                                        });
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-[11px]"
                                  onClick={() =>
                                    updateQuestion(q.id, {
                                      criteria: [...q.criteria, "New criterion"],
                                      baselinePass: [...q.baselinePass, false],
                                      cmPass: [...q.cmPass, false],
                                    })
                                  }
                                >
                                  <Plus className="mr-1 h-3 w-3" /> Add criterion
                                </Button>
                              </div>
                            </Field>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingQ(null)}>
                                Done
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Field label="Expected criteria">
                              <ul className="space-y-1">
                                {q.criteria.map((c, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                                      {q.cmPass[i] ? (
                                        <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                                      ) : (
                                        <X className="h-3.5 w-3.5 text-destructive" />
                                      )}
                                    </span>
                                    <span>{c}</span>
                                  </li>
                                ))}
                              </ul>
                            </Field>

                            <div className="grid gap-3 md:grid-cols-2">
                              <ResponsePanel label="Without ClearMetric" tone="bad" text={q.baselineResponse} />
                              <ResponsePanel label="With ClearMetric" tone="good" text={q.cmResponse} />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {qs.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No tests yet.{" "}
                  <button onClick={addQuestion} className="text-primary underline-offset-2 hover:underline">
                    Add one
                  </button>{" "}
                  or generate from definition.
                </div>
              )}
            </div>
          </div>

          {/* Ask AI */}
          <AskAI defName={def.name} />

          <div className="mx-6 mb-8 rounded-lg border border-dashed border-border p-5 text-center opacity-60">
            <div className="text-xs font-medium">Live answer tests</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Run queries against your data to test end-to-end accuracy. Coming soon.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function ScorePill({ pass, total, tone }: { pass: number; total: number; tone: "good" | "bad" }) {
  const full = pass === total && total > 0;
  const none = pass === 0;
  const color =
    tone === "good"
      ? full
        ? "text-[var(--success)]"
        : none
        ? "text-destructive"
        : "text-muted-foreground"
      : none
      ? "text-destructive"
      : full
      ? "text-[var(--success)]"
      : "text-muted-foreground";
  return <span className={cn("font-mono text-[11px] tabular-nums", color)}>{pass}/{total}</span>;
}

function ScoreCard({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" | "accent" }) {
  const toneClass =
    tone === "good" ? "text-[var(--success)]" : tone === "bad" ? "text-destructive" : "text-primary";
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1.5 text-2xl font-semibold tracking-tight tabular-nums", toneClass)}>{value}</div>
    </div>
  );
}

function ResponsePanel({ label, tone, text }: { label: string; tone: "good" | "bad"; text: string }) {
  const headerCls =
    tone === "good"
      ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
      : "bg-destructive/10 text-destructive border-destructive/20";
  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div className={cn("border-b px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider", headerCls)}>
        {label}
      </div>
      <div className="px-3 py-2.5 text-xs leading-relaxed">{text}</div>
    </div>
  );
}

function AskAI({ defName }: { defName: string }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<{ baseline: string; cm: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 700));
    setResult({
      baseline:
        "Without specific company context, I'd interpret this in the most common industry sense. The answer may vary based on definitions used in your organization.",
      cm: `Based on the company definition of ${defName}, the answer is grounded in the formula, scope, and exclusions documented for this metric.`,
    });
    setLoading(false);
  };

  return (
    <div className="border-y border-border bg-muted/20 px-6 py-5">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3 w-3" /> Ask AI · quick comparison
      </div>
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder={`Ask anything about ${defName}…`}
          className="h-8 text-sm"
        />
        <Button size="sm" className="h-8 text-xs" onClick={ask} disabled={loading || !q.trim()}>
          {loading ? <RotateCw className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
          Ask
        </Button>
      </div>
      {result && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <ResponsePanel label="Without ClearMetric" tone="bad" text={result.baseline} />
          <ResponsePanel label="With ClearMetric" tone="good" text={result.cm} />
        </div>
      )}
    </div>
  );
}
