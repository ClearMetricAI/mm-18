import { useState, type ReactNode } from "react";
import { Check, Pencil, X, Sparkles, AlertTriangle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SuggestionKind } from "@/lib/engine";

const kindMeta: Record<SuggestionKind, { label: string; icon: ReactNode; tone: string }> = {
  definition: { label: "Draft definition", icon: <Sparkles className="h-3 w-3" />, tone: "text-primary" },
  "test-question": { label: "Test question", icon: <Sparkles className="h-3 w-3" />, tone: "text-primary" },
  drift: { label: "Drift alert", icon: <AlertTriangle className="h-3 w-3" />, tone: "text-[var(--warning-foreground)]" },
  improvement: { label: "Improvement", icon: <Sparkles className="h-3 w-3" />, tone: "text-primary" },
  alias: { label: "Aliases", icon: <Sparkles className="h-3 w-3" />, tone: "text-primary" },
};

export interface ReviewCardProps {
  kind: SuggestionKind;
  title: string;
  rationale: string;
  children?: ReactNode;
  onAccept?: () => void;
  onEdit?: () => void;
  onDismiss?: () => void;
  acceptLabel?: string;
}

export function ReviewCard({
  kind,
  title,
  rationale,
  children,
  onAccept,
  onEdit,
  onDismiss,
  acceptLabel = "Accept",
}: ReviewCardProps) {
  const meta = kindMeta[kind];
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className={cn("mb-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider", meta.tone)}>
            {meta.icon}
            {meta.label}
          </div>
          <div className="truncate text-sm font-medium">{title}</div>
          {children && <div className="mt-1.5 text-xs leading-relaxed text-foreground/80">{children}</div>}
          <div className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{rationale}</div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onAccept && (
            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={onAccept}>
              <Check className="h-3.5 w-3.5 text-[var(--success)]" />
              {acceptLabel}
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onEdit} title="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={onDismiss}
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export interface ReviewStripProps {
  count: number;
  children: ReactNode;
  defaultOpen?: boolean;
  label?: string;
}

export function ReviewStrip({ count, children, defaultOpen = true, label }: ReviewStripProps) {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;
  return (
    <div className="border-b border-border bg-muted/20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-6 py-2 text-left text-xs hover:bg-muted/40"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">
          {count} {label ?? "suggestion"}{count === 1 ? "" : "s"} from the engine
        </span>
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform",
            !open && "-rotate-90",
          )}
        />
      </button>
      {open && <div className="space-y-2 px-6 pb-3">{children}</div>}
    </div>
  );
}
