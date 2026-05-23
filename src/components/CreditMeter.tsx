import { Link } from "@tanstack/react-router";
import { useBilling, formatK, canSeeBilling } from "@/lib/billing-mock";
import { cn } from "@/lib/utils";

export function CreditMeter() {
  const { used, total, role } = useBilling();
  if (!canSeeBilling(role)) return null;
  const pct = Math.min(100, (used / total) * 100);
  const tone =
    pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-foreground/70";

  return (
    <Link
      to="/settings"
      className="block rounded-md px-2.5 py-1.5 text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      title="Billing & usage"
    >
      <div className="flex items-center justify-between text-[11px] tabular-nums">
        <span className="text-sidebar-foreground/60">Credits</span>
        <span>
          {formatK(used)} <span className="text-sidebar-foreground/40">/ {formatK(total)}</span>
        </span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-sidebar-accent/60">
        <div
          className={cn("h-full transition-all", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
