import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Paperclip, X, Lock, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useBaselines, baselinesApi, type Baseline } from "@/lib/baselines-store";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/baselines")({
  component: BaselinesPage,
});

function BaselinesPage() {
  const baselines = useBaselines();
  const [activeId, setActiveId] = useState<string>(baselines[0]?.id ?? "");
  const active = baselines.find((b) => b.id === activeId) ?? baselines[0];
  const selectedCount = baselines.filter((b) => b.selected).length;

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          title="Baselines"
          meta={`${baselines.length} total · ${selectedCount} active in experiments`}
          actions={
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const b = baselinesApi.add();
                setActiveId(b.id);
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> New baseline
            </Button>
          }
        />

        <div className="flex min-h-0 flex-1">
          {/* List */}
          <div className="w-72 shrink-0 overflow-y-auto border-r border-border bg-muted/20">
            <div className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Library
            </div>
            <ul className="px-2 pb-3">
              {baselines.map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => setActiveId(b.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                      activeId === b.id ? "bg-accent" : "hover:bg-accent/50",
                    )}
                  >
                    <Checkbox
                      checked={b.selected}
                      onCheckedChange={() => baselinesApi.toggle(b.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5"
                    />
                    <span className="min-w-0 flex-1 truncate">{b.name}</span>
                    {b.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </button>
                </li>
              ))}
            </ul>
            <p className="px-4 pb-4 text-[11px] leading-relaxed text-muted-foreground">
              Check a baseline to include it in every experiment run. Each run grades the model
              with that context vs. with ClearMetric added.
            </p>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto">
            {active ? (
              <BaselineEditor baseline={active} />
            ) : (
              <div className="p-10 text-sm text-muted-foreground">No baseline selected.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function BaselineEditor({ baseline }: { baseline: Baseline }) {
  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Input
          value={baseline.name}
          onChange={(e) => baselinesApi.update(baseline.id, { name: e.target.value })}
          disabled={baseline.locked}
          className="h-9 flex-1 text-sm font-medium"
        />
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
          <Checkbox
            checked={baseline.selected}
            onCheckedChange={() => baselinesApi.toggle(baseline.id)}
          />
          Use in experiments
        </label>
        {!baseline.locked && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => baselinesApi.remove(baseline.id)}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
          </Button>
        )}
      </div>

      {baseline.locked && (
        <p className="mb-5 rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
          The cold model is the bare LLM with no prompt or context — kept as the floor of every
          comparison.
        </p>
      )}

      <Section label="System prompt" hint="What your agent is told at the start of every turn.">
        <Textarea
          value={baseline.systemPrompt}
          onChange={(e) => baselinesApi.update(baseline.id, { systemPrompt: e.target.value })}
          disabled={baseline.locked}
          placeholder="You are a data analyst at Contoso…"
          className="min-h-[120px] resize-y font-mono text-xs leading-relaxed"
        />
      </Section>

      <Section
        label="Extra context"
        hint="Schemas, glossary, dbt docs, RAG snippets — anything the agent normally has access to."
      >
        <Textarea
          value={baseline.extraContext}
          onChange={(e) => baselinesApi.update(baseline.id, { extraContext: e.target.value })}
          disabled={baseline.locked}
          placeholder="Paste table schemas, glossary, or anything your agent normally has access to."
          className="min-h-[140px] resize-y font-mono text-xs leading-relaxed"
        />
      </Section>

      <Section label="Files" hint="PDFs, docs, CSVs attached to every run.">
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground",
              baseline.locked && "pointer-events-none opacity-50",
            )}
          >
            <Paperclip className="h-3.5 w-3.5" />
            Attach files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []).map((f) => ({
                  name: f.name,
                  size: f.size,
                }));
                baselinesApi.update(baseline.id, { files: [...baseline.files, ...list] });
                e.target.value = "";
              }}
            />
          </label>
          {baseline.files.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-md bg-background px-2 py-1 text-[11px] text-foreground/80 ring-1 ring-border"
            >
              <span className="max-w-[180px] truncate">{f.name}</span>
              <span className="text-muted-foreground">
                {Math.max(1, Math.round(f.size / 1024))}kb
              </span>
              {!baseline.locked && (
                <button
                  onClick={() =>
                    baselinesApi.update(baseline.id, {
                      files: baseline.files.filter((_, j) => j !== i),
                    })
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      </Section>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Changes save automatically.</span>
        <Link
          to="/experiment"
          className="inline-flex items-center gap-1 text-foreground hover:underline"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Go to experiments
        </Link>
      </div>
    </div>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1 flex items-baseline justify-between">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-[11px] text-muted-foreground/80">{hint}</div>
      </div>
      {children}
    </div>
  );
}
