import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { PLANS, setPlan, type Plan } from "@/lib/billing-mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — ClearMetric" },
      {
        name: "description",
        content:
          "Credits cover engine work — drafts, drift checks, improvements. AI serving is always unlimited.",
      },
    ],
  }),
});

function PricingPage() {
  const navigate = useNavigate();

  const choose = (p: Plan) => {
    if (p.id === "business") {
      toast.success("We'll be in touch about Business.");
      return;
    }
    setPlan(p.id);
    toast.success(`Moved to ${p.name}.`);
    navigate({ to: "/settings" });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Simple, usage-based pricing</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Credits cover engine work — drafts, drift checks, improvements.{" "}
            <span className="text-foreground">AI serving is always unlimited.</span>
          </p>
        </div>

        <div className="mt-12 grid gap-3 md:grid-cols-4">
          {PLANS.map((p, i) => {
            const featured = i === 2;
            return (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col rounded-lg border p-5",
                  featured
                    ? "border-foreground bg-card shadow-sm"
                    : "border-border bg-card",
                )}
              >
                <div className="text-sm font-medium">{p.name}</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">{p.price}</div>

                <div className="mt-6 space-y-2 text-sm">
                  <Row>
                    {p.monthlyCredits.toLocaleString()} credits
                  </Row>
                  <Row>{p.sources}</Row>
                  <Row>Unlimited AI serving</Row>
                  {p.id === "team" && <Row>SSO</Row>}
                  {p.id === "business" && (
                    <>
                      <Row>SSO</Row>
                      <Row>Audit log</Row>
                      <Row>On-prem MCP</Row>
                    </>
                  )}
                </div>

                <button
                  onClick={() => choose(p)}
                  className={cn(
                    "mt-6 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    featured
                      ? "bg-foreground text-background hover:opacity-90"
                      : "border border-border bg-background hover:bg-accent",
                  )}
                >
                  {p.id === "free"
                    ? "Start free"
                    : p.id === "business"
                      ? "Contact us"
                      : "Choose"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-lg border border-border bg-muted/30 p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            What's a credit?
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Cost label="Drafting a new definition" cost="10 credits" />
            <Cost label="Drift check (per definition / day)" cost="1 credit" />
            <Cost label="Improvement suggestion" cost="3 credits" />
            <Cost label="Connector sync (per source / day)" cost="5 credits" />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-foreground/80">
      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/50" />
      <span>{children}</span>
    </div>
  );
}

function Cost({ label, cost }: { label: string; cost: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs text-foreground">{cost}</span>
    </div>
  );
}
