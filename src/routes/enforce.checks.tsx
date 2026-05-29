import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Zap } from "lucide-react";
import { CheckQueue } from "@/components/checks/CheckQueue";
import { CheckDetail } from "@/components/checks/CheckDetail";
import { useChecks } from "@/lib/referee/checks-store";
import { simulateMetadataChange } from "@/lib/referee/engine";
import { toast } from "sonner";

export const Route = createFileRoute("/enforce/checks")({
  component: ChecksPage,
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
});

function ChecksPage() {
  const { id: selectedId } = Route.useSearch();
  const { checks, byStatus } = useChecks();
  const navigate = useNavigate();

  const select = (id: string) =>
    navigate({
      to: "/enforce/checks",
      search: (prev: Record<string, unknown>) => ({ ...prev, id }),
      replace: true,
    });

  // Auto-select first deviating check if nothing selected
  useEffect(() => {
    if (selectedId) return;
    const first = byStatus("deviating")[0] ?? checks[0];
    if (first) {
      navigate({
        to: "/enforce/checks",
        search: { id: first.id },
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="text-sm font-semibold">Checks</h1>
          <span className="font-mono text-xs text-muted-foreground">
            {checks.length} watched
          </span>
        </div>
        <button
          onClick={() => {
            // Demo the cost engine: rename orders.region → only affected checks re-run.
            const { affected, run } = simulateMetadataChange(checks, "md.orders.region");
            if (affected.length === 0) {
              toast("No checks affected — 0 AI calls.", {
                description: "Cheap metadata diff caught it before any tool was asked.",
              });
            } else {
              toast.success(`Re-evaluated ${affected.length} affected check(s)`, {
                description: `${run.costUnits} credits used. ${checks.length - affected.length} dormant checks cost $0.`,
              });
            }
          }}
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Simulate a metadata change in the source"
        >
          <Zap className="h-3 w-3" />
          Simulate metadata change
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <CheckQueue
          selectedId={selectedId ?? null}
          onSelect={select}
        />
        <CheckDetail checkId={selectedId ?? null} />
      </div>
    </div>
  );
}
