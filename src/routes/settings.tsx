import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Upload } from "lucide-react";
import { dataSources as seedSources, llmKeys, type DataSource } from "@/lib/mock-data";
import { McpConnectPanel } from "@/components/mcp-connect";
import { toast } from "sonner";
import {
  useBilling,
  setScenario,
  setRole,
  addBonus,
  setTrialEnd,
  canSeeBilling,
  TOP_UPS,
  BREAKDOWN_TEAM,
  ROLES,
  type Scenario,
  type Role,
} from "@/lib/billing-mock";
import { cn } from "@/lib/utils";

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
      <PageHeader title="Settings" meta="Workspace · Billing · Data sources · MCP endpoint · LLM keys" />

      <WorkspaceSection />
      <BillingSection />

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
          Upload a spreadsheet, data dictionary, or dbt YAML and Referee extracts metric
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

function WorkspaceSection() {
  const { role } = useBilling();
  return (
    <Section title="Workspace">
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Your role controls what you can see and do. Billing, plans, and credit
        usage are only visible to Owners and Admins.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {ROLES.map((r) => {
          const active = role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setRole(r.id as Role)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left transition-colors",
                active
                  ? "border-foreground bg-accent"
                  : "border-border bg-card hover:border-foreground/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{r.name}</span>
                {active && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Current
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{r.blurb}</div>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

function BillingSection() {
  const { plan, used, total, scenario, role, trialDaysLeft } = useBilling();
  if (!canSeeBilling(role)) return null;
  const pct = Math.min(100, (used / total) * 100);
  const tone =
    pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-foreground/70";

  const buyPack = (credits: number, price: string) => {
    addBonus(credits);
    toast.success(`Added ${credits.toLocaleString()} credits — ${price}`);
  };

  const toggleTrial = () => {
    if (trialDaysLeft != null) {
      setTrialEnd(null);
      toast.info("Trial ended");
    } else {
      const end = new Date();
      end.setDate(end.getDate() + 14);
      setTrialEnd(end.toISOString());
      toast.success("14-day trial started");
    }
  };

  return (
    <Section title="Billing">
      {/* Plan */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <div className="text-sm">
          <span className="font-medium">{plan.name}</span>
          <span className="text-muted-foreground"> · {plan.price}</span>
        </div>
        <Link
          to="/pricing"
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Change
        </Link>
      </div>

      {/* Usage */}
      <div className="mb-6">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span>
            <span className="font-medium tabular-nums">{used.toLocaleString()}</span>
            <span className="text-muted-foreground"> / {total.toLocaleString()} credits</span>
          </span>
          <span className="text-xs text-muted-foreground">resets Dec 14</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full transition-all", tone)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-4 grid gap-1.5 text-sm">
          {Object.entries(BREAKDOWN_TEAM).map(([label, n]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className="tabular-nums">{n.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top up */}
      <div className="mb-6">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Top up
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {TOP_UPS.map((t) => (
            <button
              key={t.credits}
              onClick={() => buyPack(t.credits, t.price)}
              className="rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-foreground hover:bg-accent"
            >
              <div className="text-sm font-medium tabular-nums">
                {t.credits.toLocaleString()} credits
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{t.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Trial toggle */}
      <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <div className="text-sm">
          <span className="font-medium">Trial</span>
          <span className="text-muted-foreground">
            {trialDaysLeft != null ? ` · ${trialDaysLeft} days left` : " · Not active"}
          </span>
        </div>
        <button
          onClick={toggleTrial}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            trialDaysLeft != null
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "bg-primary text-primary-foreground hover:opacity-90",
          )}
        >
          {trialDaysLeft != null ? "End trial" : "Start 14-day trial"}
        </button>
      </div>

      {/* Scenario toggle (dev-only feel) */}
      <div className="flex items-center justify-end gap-3 border-t border-dashed border-border pt-3 text-[10px] text-muted-foreground/60">
        <span className="uppercase tracking-wider">Demo scenario</span>
        {(["healthy", "warning", "hit"] as Scenario[]).map((s) => (
          <button
            key={s}
            onClick={() => setScenario(s)}
            className={cn(
              "rounded px-2 py-0.5 capitalize hover:text-foreground",
              scenario === s && "bg-muted text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </Section>
  );
}
