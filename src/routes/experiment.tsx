import { createFileRoute, Link } from "@tanstack/react-router";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  MoreHorizontal,
  Info,
  Gavel,
  SlidersHorizontal,
  Paperclip,
} from "lucide-react";

import { useMemo, useState } from "react";
import {
  definitions,
  testQuestions as seedQuestions,
  availableModels,
  judgeModel,
  draftTestQuestions,
  type TestQuestion,
} from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBaselines, baselinesApi } from "@/lib/baselines-store";

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
  const [running, setRunning] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const baselines = useBaselines();
  const activeBaselines = baselines.filter((b) => b.selected);
  const [viewBaselineId, setViewBaselineId] = useState<string>("cold");
  // Make sure view always points at a selected baseline
  const effectiveViewId =
    activeBaselines.find((b) => b.id === viewBaselineId)?.id ?? activeBaselines[0]?.id ?? "cold";

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
    const changed = qs.filter(
      (q) =>
        q.baselineResponse !== q.cmResponse &&
        !q.baselineResponse.startsWith("(not run") &&
        !q.cmResponse.startsWith("(not run"),
    ).length;
    return { baseline, cm, total, changed, questions: qs.length };
  }, [qs]);

  const improvement =
    scores.total > 0 ? Math.round(((scores.cm - scores.baseline) / scores.total) * 100) : 0;
  const changedPct =
    scores.questions > 0 ? Math.round((scores.changed / scores.questions) * 100) : 0;

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
      baselineReasons: ["(not graded yet)"],
      cmReasons: ["(not graded yet)"],
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
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen">
        {/* Left: definition list */}
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
                        cm === tot
                          ? "text-[var(--success)]"
                          : cm === 0
                          ? "text-destructive"
                          : "text-muted-foreground",
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
          {/* Slim header — name only + actions */}
          <div className="flex h-14 items-center justify-between border-b border-border px-6">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-semibold">{def.name}</h1>
              <button
                onClick={() => setShowAbout((v) => !v)}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="About this metric"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground md:flex">
                    <Gavel className="h-3 w-3" />
                    Judge: <span className="font-mono text-foreground">{judgeModel}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                  Each criterion is graded yes/no by an LLM judge that reads the answer and the
                  criterion. Reasoning is shown next to every check.
                </TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] transition-colors",
                      activeBaselines.length > 1
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                    title="Pick which baselines to compare against ClearMetric"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    Baselines:
                    <span className="font-medium text-foreground">
                      {activeBaselines.length === 0
                        ? "none"
                        : activeBaselines.length === 1
                        ? activeBaselines[0].name
                        : `${activeBaselines.length} selected`}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 text-xs">
                  <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Compare against
                  </DropdownMenuLabel>
                  {baselines.map((b) => (
                    <DropdownMenuCheckboxItem
                      key={b.id}
                      checked={b.selected}
                      onCheckedChange={() => baselinesApi.toggle(b.id)}
                      onSelect={(e) => e.preventDefault()}
                      className="text-xs"
                    >
                      {b.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="text-xs">
                    <Link to="/baselines" className="flex items-center gap-2">
                      <Plus className="h-3 w-3" /> Manage baselines
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  const drafted = draftTestQuestions(def);
                  setQuestions((prev) => [...prev, ...drafted]);
                  setOpenQ(drafted[0].id);
                  toast.success(`${drafted.length} questions drafted`, {
                    description: "Review and run — baseline & ClearMetric responses come from real model runs.",
                  });
                }}
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Generate questions
              </Button>
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

          {/* Collapsible about strip */}
          {showAbout && (
            <div className="border-b border-border bg-muted/20 px-6 py-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {def.domain}
                </Badge>
                <span>Owner: <span className="text-foreground">{def.owner}</span></span>
                <span>·</span>
                <span>Source: <span className="text-foreground">{def.source}</span></span>
                <span>·</span>
                <span>{def.status === "tested" ? "Tested" : "Draft"}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-foreground/80">{def.description}</p>
            </div>
          )}

          {/* Collapsible baseline setup */}
          {showBaseline && (
            <div className="border-b border-border bg-muted/20 px-6 py-4">
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Baseline setup
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {baselineCustom
                      ? "Your custom baseline is active. Both runs use it; only the ClearMetric run also gets the definition."
                      : "Default = cold model, nothing attached. Add your agent's real prompt and context below so the comparison reflects production."}
                  </p>
                </div>
                {baselineCustom && (
                  <button
                    onClick={() => { setSysPrompt(""); setExtraContext(""); setFiles([]); }}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    System prompt
                  </label>
                  <Textarea
                    value={sysPrompt}
                    onChange={(e) => setSysPrompt(e.target.value)}
                    placeholder="You are a data analyst at Contoso. Answer using our finance conventions…"
                    className="min-h-[96px] resize-y font-mono text-[11px] leading-relaxed"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Extra context
                    <span className="ml-1 normal-case tracking-normal text-muted-foreground/70">(schemas, dbt docs, RAG snippets)</span>
                  </label>
                  <Textarea
                    value={extraContext}
                    onChange={(e) => setExtraContext(e.target.value)}
                    placeholder="Paste table schemas, glossary, or anything your agent normally has access to."
                    className="min-h-[96px] resize-y font-mono text-[11px] leading-relaxed"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground">
                  <Paperclip className="h-3 w-3" />
                  Attach files
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const list = Array.from(e.target.files ?? []).map((f) => ({ name: f.name, size: f.size }));
                      setFiles((prev) => [...prev, ...list]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {files.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-[11px] text-foreground/80 ring-1 ring-border">
                    <span className="truncate max-w-[160px]">{f.name}</span>
                    <span className="text-muted-foreground">{Math.max(1, Math.round(f.size / 1024))}kb</span>
                    <button
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <span className="ml-auto text-[10px] text-muted-foreground">
                  Applied to every test run · not stored
                </span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {/* ROI headline — one line, one number */}
            <div className="px-6 py-5">
              {scores.questions === 0 ? (
                <div className="text-sm text-muted-foreground">No tests yet.</div>
              ) : (
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                    {scores.baseline}/{scores.total}
                  </span>
                  <span className="text-muted-foreground/60">→</span>
                  <span className="font-mono text-2xl font-semibold tabular-nums text-[var(--success)]">
                    {scores.cm}/{scores.total}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    criteria passed with grounding
                  </span>
                </div>
              )}
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
                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Test questions · {qs.length}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[280px] text-xs">
                      For each question, the answering model is run twice — once without your
                      definition (baseline) and once with it (ClearMetric). The judge then grades each
                      criterion pass/fail with a one-line reason.
                    </TooltipContent>
                  </Tooltip>
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
                        <ScorePill pass={bp} total={q.criteria.length} />
                        <span className="text-muted-foreground">→</span>
                        <ScorePill pass={cp} total={q.criteria.length} />
                        <div
                          className="flex items-center gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                            onClick={() => runOne(q.id)}
                            title="Re-run"
                          >
                            {running === q.id ? (
                              <RotateCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                title="More"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem
                                onClick={() => {
                                  setOpenQ(q.id);
                                  setEditingQ(q.id);
                                }}
                              >
                                <Pencil className="mr-2 h-3 w-3" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => runOne(q.id)}>
                                <RotateCw className="mr-2 h-3 w-3" /> Re-run
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => deleteQuestion(q.id)}
                              >
                                <Trash2 className="mr-2 h-3 w-3" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                                          updateQuestion(q.id, {
                                            criteria: q.criteria.filter((_, j) => j !== i),
                                            baselinePass: q.baselinePass.filter((_, j) => j !== i),
                                            cmPass: q.cmPass.filter((_, j) => j !== i),
                                            baselineReasons: q.baselineReasons.filter((_, j) => j !== i),
                                            cmReasons: q.cmReasons.filter((_, j) => j !== i),
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
                                        baselineReasons: [...q.baselineReasons, "(not graded yet)"],
                                        cmReasons: [...q.cmReasons, "(not graded yet)"],
                                      })
                                    }
                                  >
                                    <Plus className="mr-1 h-3 w-3" /> Add criterion
                                  </Button>
                                </div>
                              </Field>
                              <div className="flex justify-end gap-2">
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
                              <Field
                                label={`Criteria · graded by ${judgeModel}`}
                              >
                                <ul className="space-y-1.5">
                                  {q.criteria.map((c, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                                        {q.cmPass[i] ? (
                                          <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                                        ) : (
                                          <X className="h-3.5 w-3.5 text-destructive" />
                                        )}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <div>{c}</div>
                                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                                          {q.cmReasons[i]}
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </Field>

                              <div className="grid gap-3 md:grid-cols-2">
                                <ResponsePanel
                                  label="Ungrounded"
                                  sublabel="LLM alone"
                                  tooltip="The model answers from training data only. No company context."
                                  tone="bad"
                                  text={q.baselineResponse}
                                  passed={q.baselinePass}
                                  reasons={q.baselineReasons}
                                  criteria={q.criteria}
                                />
                                <ResponsePanel
                                  label="Grounded"
                                  sublabel="LLM + your definitions"
                                  tooltip="The model answers using your approved ClearMetric definitions as context."
                                  tone="good"
                                  text={q.cmResponse}
                                  passed={q.cmPass}
                                  reasons={q.cmReasons}
                                  criteria={q.criteria}
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
                    No tests yet.{" "}
                    <button
                      onClick={addQuestion}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      Add one
                    </button>
                    .
                  </div>
                )}
              </div>
            </div>

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
    </TooltipProvider>
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

function ScorePill({ pass, total }: { pass: number; total: number }) {
  const full = pass === total && total > 0;
  const none = pass === 0;
  const color = full
    ? "text-[var(--success)]"
    : none
    ? "text-destructive"
    : "text-muted-foreground";
  return <span className={cn("font-mono text-[11px] tabular-nums", color)}>{pass}/{total}</span>;
}

function ScoreCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "accent";
}) {
  const toneClass =
    tone === "good"
      ? "text-[var(--success)]"
      : tone === "bad"
      ? "text-destructive"
      : "text-primary";
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1.5 text-2xl font-semibold tracking-tight tabular-nums", toneClass)}>
        {value}
      </div>
    </div>
  );
}

function ResponsePanel({
  label,
  sublabel,
  tooltip,
  tone,
  text,
  passed,
  reasons,
  criteria,
}: {
  label: string;
  sublabel?: string;
  tooltip?: string;
  tone: "good" | "bad";
  text: string;
  passed: boolean[];
  reasons: string[];
  criteria: string[];
}) {
  const headerCls =
    tone === "good"
      ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
      : "bg-destructive/10 text-destructive border-destructive/20";
  const passCount = passed.filter(Boolean).length;
  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div
        className={cn(
          "flex items-center justify-between border-b px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider",
          headerCls,
        )}
      >
        <span className="flex items-center gap-1.5">
          <span>{label}</span>
          {sublabel && (
            <span className="font-normal normal-case tracking-normal opacity-70">· {sublabel}</span>
          )}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help opacity-70" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
        <span className="font-mono">{passCount}/{passed.length}</span>
      </div>

      <div className="px-3 py-2.5 text-xs leading-relaxed">{text}</div>
      <div className="border-t border-border bg-muted/20 px-3 py-2">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Judge notes
        </div>
        <ul className="space-y-1">
          {criteria.map((c, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px]">
              {passed[i] ? (
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-[var(--success)]" />
              ) : (
                <X className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
              )}
              <span className="text-muted-foreground">
                <span className="text-foreground">{c}.</span> {reasons[i]}
              </span>
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
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <div className="border-b bg-destructive/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-destructive border-destructive/20">
              Ungrounded · LLM alone
            </div>
            <div className="px-3 py-2.5 text-xs leading-relaxed">{result.baseline}</div>
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <div className="border-b bg-[var(--success)]/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--success)] border-[var(--success)]/20">
              Grounded · LLM + your definitions
            </div>
            <div className="px-3 py-2.5 text-xs leading-relaxed">{result.cm}</div>
          </div>
        </div>
      )}
    </div>
  );
}
