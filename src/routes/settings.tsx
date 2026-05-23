import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw } from "lucide-react";
import { dataSources, llmKeys } from "@/lib/mock-data";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? "bg-[var(--success)]" : "bg-destructive"}`}
    />
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="px-8 py-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Settings" meta="Data sources · LLM keys" />

      <Section
        title="Data sources"
        action={
          <Button size="sm" variant="outline">
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add source
          </Button>
        }
      >
        <div className="grid gap-2">
          {dataSources.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDot ok={s.status === "connected"} />
                    <span className="font-medium">{s.name}</span>
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {s.type}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.summary}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Last sync · {s.lastSync}</div>
                </div>
                <Button size="sm" variant="ghost">
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Sync
                </Button>
              </div>
            </div>
          ))}
        </div>
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
