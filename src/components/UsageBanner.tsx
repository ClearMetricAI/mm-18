import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { useBilling } from "@/lib/billing-mock";
import { cn } from "@/lib/utils";

export function UsageBanner() {
  const { scenario } = useBilling();
  const [dismissed, setDismissed] = useState(false);

  if (scenario === "healthy") return null;
  if (scenario === "warning" && dismissed) return null;

  const hit = scenario === "hit";
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b px-4 py-1.5 text-xs",
        hit
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      <span className="truncate">
        {hit
          ? "Credits exhausted. Engine paused — definitions keep serving to AI."
          : "You've used 85% of your credits this month."}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/settings"
          className="rounded px-2 py-0.5 font-medium underline-offset-2 hover:underline"
        >
          Top up
        </Link>
        {!hit && (
          <button
            onClick={() => setDismissed(true)}
            className="rounded p-0.5 hover:bg-foreground/10"
            title="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
