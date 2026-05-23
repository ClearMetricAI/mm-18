import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Upload } from "lucide-react";
import { dataSources as seedSources, llmKeys, type DataSource } from "@/lib/mock-data";
import { McpConnectPanel } from "@/components/mcp-connect";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? "bg-[var(--success)]" : "bg-destructive"}`}
    />
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="px-8 py-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SettingsPage() {
  const [sources, setSources] = useState<DataSource[]>(seedSources);

  const handleUpload = (file: File) => {
    // Mock — pretend we extracted a deterministic-ish count.
    const extracted = Math.max(3, Math.min(40, Math.round(file.size / 1500) % 40 || 12));
    const today = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const next: DataSource = {
      id: `src_upload_${Date.now()}`,
      name: file.name,
      type: "Upload",
      status: "imported",
      summary: `${extracted} definitions extracted`,
      lastSync: `Imported ${today}`,
    };
    setSources((prev) => [...prev, next]);
    toast.success(`Drafted ${extracted} definitions from ${file.name}`, {
      description: "Review them on Define.",
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Settings" meta="Data sources · MCP endpoint · LLM keys" />

      <Section
        title="Data sources"
        action={
          <div className="flex items-center gap-2">
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent">
              <Upload className="h-3.5 w-3.5" />
              Upload file
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.pdf,.docx,.md,.yaml,.yml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add source
            </Button>
          </div>
        }
      >
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Upload a spreadsheet, data dictionary, or dbt YAML and ClearMetric extracts metric
          definitions as drafts on Define. Live connections sync on a schedule.
        </p>
        <div className="grid gap-2">
          {sources.map((s) => {
            const isUpload = s.type === "Upload";
            return (
              <div key={s.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusDot ok={s.status !== "error"} />
                      <span className="font-medium">{s.name}</span>
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {s.type}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{s.summary}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {isUpload ? s.lastSync : `Last sync · ${s.lastSync}`}
                    </div>
                  </div>
                  {!isUpload && (
                    <Button size="sm" variant="ghost">
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                      Sync
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="MCP endpoint">
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Paste this into any MCP-aware agent (Copilot Studio, Claude, Cursor, your own). Usage
          shows up on the Serve page.
        </p>
        <McpConnectPanel />
      </Section>

      <Section
        title="LLM keys"
        action={
          <Button size="sm" variant="outline">
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add key
          </Button>
        }
      >
        <div className="grid gap-2">
          {llmKeys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <StatusDot ok={k.status === "valid"} />
                <span className="font-medium">{k.provider}</span>
                <span className="font-mono text-xs text-muted-foreground">{k.model}</span>
              </div>
              <span className="text-xs text-muted-foreground">Added {k.added}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
