import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Copy, Check } from "lucide-react";
import { dataSources, llmKeys } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/connect")({ component: ConnectPage });

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

function ConnectPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const endpoint = "https://mcp.clearmetric.ai/org_contoso/v1";
  const apiKey = "cm_live_••••••••••••••••2f8a";

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div>
      <PageHeader title="Connect" description="Data sources, LLM keys, and your MCP endpoint." />

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

      <Section title="MCP endpoint">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <StatusDot ok />
            <span className="text-sm font-medium">Active</span>
            <span className="ml-auto text-xs text-muted-foreground">
              312 calls this week · 18 definitions served
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <FieldCopy label="Endpoint URL" value={endpoint} copied={copied === "url"} onCopy={() => copy("url", endpoint)} />
            <FieldCopy label="API key" value={apiKey} copied={copied === "key"} onCopy={() => copy("key", "cm_live_full_key_redacted")} />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Configure your AI assistant (Copilot Studio, Claude, Cursor) to use this MCP endpoint. Definitions you toggle
            <span className="font-medium text-foreground"> Serve to AI </span>
            will be available immediately.
          </p>
        </div>
      </Section>
    </div>
  );
}

function FieldCopy({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 font-mono text-xs">
        <span className="flex-1 truncate">{value}</span>
        <button
          onClick={onCopy}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
