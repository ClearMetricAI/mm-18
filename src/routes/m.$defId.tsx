import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  ChevronRight,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  Check,
  X,
  Send,
  ChevronDown,
} from "lucide-react";
import {
  definitions,
  testQuestions as seedQuestions,
  activityLog,
  availableModels,
  type TestQuestion,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/m/$defId")({
  component: WorkspacePage,
});

function WorkspacePage() {
  const { defId } = Route.useParams();
  const navigate = useNavigate();
  const def = definitions.find((d) => d.id === defId);

  if (!def) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Definition not found.{" "}
        <Link to="/define" className="ml-1 text-primary underline-offset-2 hover:underline">
          Back to Define
        </Link>
      </div>
    );
  }

  const [serveToAi, setServeToAi] = useState(def.serveToAi);
  const [tab, setTab] = useState("definition");

  // status dot color
  const dot =
    def.status === "tested"
      ? serveToAi
        ? "bg-[var(--success)]"
        : "bg-amber-500"
      : "bg-muted-foreground/50";
  const dotLabel =
    def.status === "tested" ? (serveToAi ? "Active · serving" : "Tested · not serving") : "Draft";

  return (
    <div className="flex h-screen flex-col">
      {/* Clean header: breadcrumb + title + status dot */}
      <div className="border-b border-border px-8 pt-4 pb-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link to="/define" className="hover:text-foreground">
            Define
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span>{def.domain}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-muted-foreground/70">{def.owner}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">{def.name}</h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
              title={dotLabel}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
              {dotLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Serve to AI
              <Switch checked={serveToAi} onCheckedChange={setServeToAi} />
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex flex-1 min-h-0 flex-col">
        <div className="border-b border-border px-8">
          <TabsList className="h-9 bg-transparent p-0">
            <WorkspaceTab value="definition">Definition</WorkspaceTab>
            <WorkspaceTab value="tests">Tests</WorkspaceTab>
            <WorkspaceTab value="live">Live usage</WorkspaceTab>
          </TabsList>
        </div>

        <TabsContent value="definition" className="flex-1 overflow-y-auto px-8 py-6 m-0">
          <DefinitionTab def={def} />
        </TabsContent>
        <TabsContent value="tests" className="flex-1 overflow-y-auto m-0">
          <TestsTab defId={def.id} defName={def.name} />
        </TabsContent>
        <TabsContent value="live" className="flex-1 overflow-y-auto m-0">
          <LiveTab defName={def.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkspaceTab({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-3 text-xs text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none"
    >
      {children}
    </TabsTrigger>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

/* ---------------- Definition tab ---------------- */
function DefinitionTab({ def }: { def: (typeof definitions)[number] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Field label="Description">
        <p className="text-sm leading-relaxed">{def.description}</p>
      </Field>
      <Field label="Formula">
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs">
          {def.formula}
        </pre>
      </Field>
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        <Field label="Owner">
          <span className="text-sm">{def.owner}</span>
        </Field>
        <Field label="Source">
          <span className="text-sm text-muted-foreground">{def.source}</span>
        </Field>
        <Field label="Domain">
          <span className="text-sm">{def.domain}</span>
        </Field>
        <Field label="Last confirmed">
          <span className="text-sm text-muted-foreground">{def.confirmedAt ?? "—"}</span>
        </Field>
      </div>
      <Field label="Used in">
        <div className="flex flex-wrap gap-1">
          {def.usedIn.map((u) => (
            <Badge key={u} variant="outline" className="text-[10px] font-normal">
              {u}
            </Badge>
          ))}
        </div>
      </Field>
    </div>
  );
}

/* ---------------- Tests tab ---------------- */
function TestsTab({ defId, defName }: { defId: string; defName: string }) {
  const [questions, setQuestions] = useState<TestQuestion[]>(seedQuestions);
  const qs = questions.filter((q) => q.definitionId === defId);
  const [openQ, setOpenQ] = useState<string | null>(qs[0]?.id ?? null);
  const [editingQ, setEditingQ] = useState<string | null>(null);
  const [model, setModel] = useState(availableModels[0]);
  const [running, setRunning] = useState<string | null>(null);

  const scores = useMemo(() => {
    const baseline = qs.reduce((a, q) => a + q.baselinePass.filter(Boolean).length, 0);
    const cm = qs.reduce((a, q) => a + q.cmPass.filter(Boolean).length, 0);
    const total = qs.reduce((a, q) => a + q.criteria.length, 0);
    return { baseline, cm, total };
  }, [qs]);

  const improvement =
    scores.total > 0 ? Math.round(((scores.cm - scores.baseline) / scores.total) * 100) : 0;

  const update = (id: string, patch: Partial<TestQuestion>) =>
    setQuestions((p) => p.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const togglePass = (id: string, kind: "baseline" | "cm", i: number) => {
    const q = questions.find((x) => x.id === id)!;
    const key = kind === "baseline" ? "baselinePass" : "cmPass";
    const next = [...q[key]];
    next[i] = !next[i];
    update(id, { [key]: next } as Partial<TestQuestion>);
  };

  const addQ = () => {
    const q: TestQuestion = {
      id: `q_new_${Date.now()}`,
      definitionId: defId,
      question: "New question",
      criteria: ["New criterion"],
      baselineResponse: "(not run yet)",
      cmResponse: "(not run yet)",
      baselinePass: [false],
      cmPass: [false],
    };
    setQuestions((p) => [...p, q]);
    setOpenQ(q.id);
    setEditingQ(q.id);
  };

  const runAll = async () => {
    setRunning("all");
    await new Promise((r) => setTimeout(r, 1000));
    setRunning(null);
  };
  const runOne = async (id: string) => {
    setRunning(id);
    await new Promise((r) => setTimeout(r, 700));
    setRunning(null);
  };
  const delQ = (id: string) => setQuestions((p) => p.filter((q) => q.id !== id));

  return (
    <div>
      {/* Tests subheader */}
      <div className="flex items-center justify-between border-b border-border px-8 py-3">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">{scores.cm}</span>
            <span className="text-muted-foreground">/{scores.total}</span> passing with ClearMetric
          </span>
          {scores.total > 0 && (
            <span className="text-[var(--success)]">+{improvement}% vs baseline</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-7 w-[140px] text-xs">
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
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={addQ}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={runAll} disabled={running === "all"}>
            {running === "all" ? (
              <RotateCw className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="mr-1 h-3.5 w-3.5" />
            )}
            Run all
          </Button>
        </div>
      </div>

      {/* How grading works hint */}
      <div className="border-b border-border bg-muted/20 px-8 py-2 text-[11px] text-muted-foreground">
        Each criterion is auto-graded by an LLM judge after every run. Click any{" "}
        <Check className="inline h-3 w-3 text-[var(--success)]" />/
        <X className="inline h-3 w-3 text-destructive" /> to override.
      </div>

      <div className="px-8 py-5">
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
                    open ? "bg-muted/40" : "cursor-pointer hover:bg-accent/40",
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
                  <span className="font-mono text-[11px] tabular-nums text-destructive">
                    {bp}/{q.criteria.length}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span
                    className={cn(
                      "font-mono text-[11px] tabular-nums",
                      cp === q.criteria.length
                        ? "text-[var(--success)]"
                        : cp === 0
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {cp}/{q.criteria.length}
                  </span>
                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <IconBtn title="Re-run" onClick={() => runOne(q.id)}>
                      <RotateCw
                        className={cn("h-3.5 w-3.5", running === q.id && "animate-spin")}
                      />
                    </IconBtn>
                    <IconBtn
                      title="Edit"
                      onClick={() => {
                        setOpenQ(q.id);
                        setEditingQ(editing ? null : q.id);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn title="Delete" onClick={() => delQ(q.id)} danger>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>

                {open && (
                  <div className="space-y-4 border-t border-border bg-background px-10 py-4">
                    {editing ? (
                      <div className="space-y-3">
                        <Field label="Question">
                          <Textarea
                            value={q.question}
                            onChange={(e) => update(q.id, { question: e.target.value })}
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
                                    update(q.id, { criteria: next });
                                  }}
                                  className="h-7 text-xs"
                                />
                                <button
                                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => {
                                    update(q.id, {
                                      criteria: q.criteria.filter((_, j) => j !== i),
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
                                update(q.id, {
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
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setEditingQ(null)}
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Side-by-side responses with inline grading */}
                        <div className="grid gap-3 md:grid-cols-2">
                          <ResponseColumn
                            label="Without ClearMetric"
                            tone="bad"
                            text={q.baselineResponse}
                            criteria={q.criteria}
                            pass={q.baselinePass}
                            onToggle={(i) => togglePass(q.id, "baseline", i)}
                          />
                          <ResponseColumn
                            label="With ClearMetric"
                            tone="good"
                            text={q.cmResponse}
                            criteria={q.criteria}
                            pass={q.cmPass}
                            onToggle={(i) => togglePass(q.id, "cm", i)}
                          />
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
              No tests yet for <span className="text-foreground">{defName}</span>.{" "}
              <button onClick={addQ} className="text-primary underline-offset-2 hover:underline">
                Add one
              </button>
              .
            </div>
          )}
        </div>

        <div className="mt-6">
          <AskAI defName={defName} />
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground",
        danger && "hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}

function ResponseColumn({
  label,
  tone,
  text,
  criteria,
  pass,
  onToggle,
}: {
  label: string;
  tone: "good" | "bad";
  text: string;
  criteria: string[];
  pass: boolean[];
  onToggle: (i: number) => void;
}) {
  const headerCls =
    tone === "good"
      ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
      : "bg-destructive/10 text-destructive border-destructive/20";
  const passed = pass.filter(Boolean).length;
  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div
        className={cn(
          "flex items-center justify-between border-b px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider",
          headerCls,
        )}
      >
        <span>{label}</span>
        <span className="font-mono tabular-nums">
          {passed}/{criteria.length}
        </span>
      </div>
      <div className="px-3 py-2.5 text-xs leading-relaxed">{text}</div>
      <div className="border-t border-border bg-muted/20 px-3 py-2">
        <ul className="space-y-1">
          {criteria.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px]">
              <button
                onClick={() => onToggle(i)}
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded hover:bg-accent"
                title="Toggle grade"
              >
                {pass[i] ? (
                  <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                ) : (
                  <X className="h-3.5 w-3.5 text-destructive" />
                )}
              </button>
              <span className={cn(!pass[i] && "text-muted-foreground")}>{c}</span>
            </li>
          ))}
        </ul>
      </div>
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
    await new Promise((r) => setTimeout(r, 600));
    setResult({
      baseline:
        "Without specific company context, I'd interpret this in the most common industry sense. The answer may vary based on definitions used in your organization.",
      cm: `Based on the company definition of ${defName}, the answer is grounded in the formula, scope, and exclusions documented for this metric.`,
    });
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3 w-3" /> Ask AI — quick try
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
          {loading ? (
            <RotateCw className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-1 h-3.5 w-3.5" />
          )}
          Ask
        </Button>
      </div>
      {result && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-destructive">
              Without ClearMetric
            </div>
            {result.baseline}
          </div>
          <div className="rounded-md border border-[var(--success)]/20 bg-[var(--success)]/5 p-3 text-xs">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--success)]">
              With ClearMetric
            </div>
            {result.cm}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Live usage tab ---------------- */
function LiveTab({ defName }: { defName: string }) {
  const entries = activityLog.filter((a) => a.definitionName === defName);
  return (
    <div className="px-8 py-6">
      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No AI calls yet for this definition. Turn on{" "}
          <span className="text-foreground">Serve to AI</span> to expose it via MCP.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-[110px_160px_180px_1fr_70px] items-center border-b border-border bg-muted/30 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <div>When</div>
            <div>Agent</div>
            <div>Tool</div>
            <div>Input</div>
            <div className="text-right">ms</div>
          </div>
          {entries.map((a) => (
            <div
              key={a.id}
              className="grid grid-cols-[110px_160px_180px_1fr_70px] items-center border-b border-border/60 px-4 py-2 text-xs last:border-b-0"
            >
              <div className="text-muted-foreground">
                {new Date(a.ts).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="truncate">{a.agent}</div>
              <div>
                <Badge variant="secondary" className="font-mono text-[10px] font-normal">
                  {a.tool}
                </Badge>
              </div>
              <div className="truncate text-muted-foreground">"{a.input}"</div>
              <div className="text-right font-mono tabular-nums text-muted-foreground">
                {a.latencyMs}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
