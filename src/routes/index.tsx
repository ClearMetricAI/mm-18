import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Sparkles,
  Plug,
  MessageSquare,
  Search,
  Inbox as InboxIcon,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useInbox, type InboxItem, type InboxKind } from "@/lib/inbox-store";

export const Route = createFileRoute("/")({
  component: InboxPage,
});

type Tab = "open" | "resolved" | "all";

const KIND_META: Record<
  InboxKind,
  { icon: typeof AlertTriangle; tone: string; label: string }
> = {
  drift: {
    icon: AlertTriangle,
    tone: "text-amber-600 dark:text-amber-400",
    label: "Drift",
  },
  draft: { icon: Sparkles, tone: "text-primary", label: "Draft" },
  improvement: { icon: Sparkles, tone: "text-primary", label: "Improvement" },
  "sync-failure": {
    icon: Plug,
    tone: "text-destructive",
    label: "Sync",
  },
  "review-request": {
    icon: MessageSquare,
    tone: "text-muted-foreground",
    label: "Review",
  },
  deviation: {
    icon: ShieldAlert,
    tone: "text-destructive",
    label: "Deviation",
  },
  "no-standard": {
    icon: HelpCircle,
    tone: "text-warning",
    label: "No standard",
  },
};


function ageLabel(h: number) {
  if (h < 1) return "just now";
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

function InboxPage() {
  const { open, resolved, all, resolve, unresolve } = useInbox();
  const [tab, setTab] = useState<Tab>("open");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const list = tab === "open" ? open : tab === "resolved" ? resolved : all;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((i) => i.title.toLowerCase().includes(q));
  }, [list, query]);

  const activeItem = activeId
    ? all.find((i) => i.id === activeId) ?? null
    : null;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 pb-2 pt-5">
        <div>
          <h1 className="text-sm font-semibold">Inbox</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each item is one decision. Resolve and move on.
          </p>
        </div>
        <div className="flex items-center gap-1 border-b border-border">
          <TabBtn active={tab === "open"} onClick={() => setTab("open")}>
            Open
            {open.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {open.length}
              </span>
            )}
          </TabBtn>
          <TabBtn
            active={tab === "resolved"}
            onClick={() => setTab("resolved")}
          >
            Resolved
            {resolved.length > 0 && (
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                {resolved.length}
              </span>
            )}
          </TabBtn>
          <TabBtn active={tab === "all"} onClick={() => setTab("all")}>
            All
            <span className="ml-1.5 text-[10px] text-muted-foreground">
              {all.length}
            </span>
          </TabBtn>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-16">
        {list.length > 0 && (
          <div className="pt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search inbox…"
                className="h-8 border-transparent bg-muted/40 pl-8 text-xs shadow-none focus-visible:border-input"
              />
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState tab={tab} hasOpen={open.length > 0} />
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-md border border-border">
            {filtered.map((item) => (
              <InboxRow
                key={item.id}
                item={item}
                isResolved={resolved.some((r) => r.id === item.id)}
                onOpen={() => setActiveId(item.id)}
                onUnresolve={() => unresolve(item.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <InboxDetailSheet
        item={activeItem}
        onOpenChange={(o) => !o && setActiveId(null)}
        onResolve={(id) => {
          resolve(id);
          setActiveId(null);
        }}
      />
    </div>
  );
}

function TabBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "-mb-px flex items-center border-b-2 px-3 py-2 text-sm transition-colors",
        active
          ? "border-foreground font-medium text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function InboxRow({
  item,
  isResolved,
  onOpen,
  onUnresolve,
}: {
  item: InboxItem;
  isResolved: boolean;
  onOpen: () => void;
  onUnresolve: () => void;
}) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className={cn(
          "flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-accent/40",
          isResolved && "opacity-60",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", meta.tone)} />
        <span
          className={cn("truncate text-sm", isResolved && "line-through")}
        >
          {item.title}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
          <span className="truncate max-w-[120px]">{item.source}</span>
          <span>·</span>
          <span>{ageLabel(item.ageHours)}</span>
          {isResolved && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-1 h-6 px-2 text-[11px]"
              onClick={(e) => {
                e.stopPropagation();
                onUnresolve();
              }}
            >
              Reopen
            </Button>
          )}
        </span>
      </div>
    </li>
  );
}

function EmptyState({ tab, hasOpen }: { tab: Tab; hasOpen: boolean }) {
  if (tab === "open" && !hasOpen) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-16 text-center">
        <InboxIcon className="h-6 w-6 text-muted-foreground/60" />
        <div className="text-sm font-medium">Inbox zero</div>
        <div className="text-xs text-muted-foreground">Nothing needs you.</div>
      </div>
    );
  }
  return (
    <div className="mt-12 rounded-md border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
      No matches.
    </div>
  );
}

function InboxDetailSheet({
  item,
  onOpenChange,
  onResolve,
}: {
  item: InboxItem | null;
  onOpenChange: (open: boolean) => void;
  onResolve: (id: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {item && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-base">
                {(() => {
                  const M = KIND_META[item.kind];
                  const I = M.icon;
                  return (
                    <>
                      <I className={cn("h-4 w-4", M.tone)} />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {M.label}
                      </span>
                    </>
                  );
                })()}
              </SheetTitle>
              <SheetDescription className="text-left text-sm font-medium text-foreground">
                {item.title}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-4 text-sm">
              {item.kind === "drift" && (
                <>
                  <p className="text-muted-foreground">
                    {item.payload.rationale}
                  </p>
                  <div className="rounded-md border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed">
                    {item.payload.note}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        onResolve(item.id);
                        toast.success("Acknowledged");
                      }}
                    >
                      Acknowledge
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigate({ to: "/define" });
                      }}
                    >
                      Open in Define
                    </Button>
                  </div>
                </>
              )}

              {item.kind === "draft" && (
                <>
                  <p className="text-muted-foreground">
                    {item.payload.rationale}
                  </p>
                  <div className="space-y-2">
                    <Field label="Description">
                      <div className="text-foreground/80">
                        {item.payload.draft.description}
                      </div>
                    </Field>
                    <Field label="Formula">
                      <pre className="overflow-x-auto rounded border border-border bg-muted/40 p-2 font-mono text-[11px] leading-relaxed">
                        {item.payload.draft.formula}
                      </pre>
                    </Field>
                    <Field label="Source">
                      <span className="text-foreground/80">
                        {item.payload.draft.source}
                      </span>
                    </Field>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        onResolve(item.id);
                        toast.success(`${item.payload.draft.name} added`);
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onResolve(item.id);
                        toast("Dismissed");
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </>
              )}

              {item.kind === "improvement" && (
                <>
                  <p className="text-muted-foreground">
                    {item.payload.rationale}
                  </p>
                  <div className="space-y-2">
                    <Field label="Before">
                      <div className="rounded border border-border bg-muted/30 p-2 text-[12px] text-muted-foreground line-through">
                        {item.payload.before}
                      </div>
                    </Field>
                    <Field label="After">
                      <div className="rounded border border-border bg-muted/30 p-2 text-[12px]">
                        {item.payload.after}
                      </div>
                    </Field>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        onResolve(item.id);
                        toast.success("Applied");
                      }}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onResolve(item.id);
                        toast("Dismissed");
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </>
              )}

              {item.kind === "sync-failure" && (
                <>
                  <p className="text-muted-foreground">{item.detail}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        navigate({ to: "/settings" });
                      }}
                    >
                      Open Connections
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onResolve(item.id);
                        toast("Snoozed");
                      }}
                    >
                      Snooze
                    </Button>
                  </div>
                </>
              )}

              {item.kind === "review-request" && (
                <>
                  <Field label={`${item.requester} asked`}>
                    <div className="text-foreground/80">"{item.note}"</div>
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        onResolve(item.id);
                        toast.success("Approved");
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigate({ to: "/define" });
                      }}
                    >
                      Open in Define
                    </Button>
              {item.kind === "deviation" && (
                <>
                  <p className="text-sm text-foreground/85">{item.causeNote}</p>
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-[11px]">
                    <div className="mb-1 font-medium uppercase tracking-wider text-destructive">
                      Deviating
                    </div>
                    <div className="flex flex-wrap gap-1 capitalize">
                      {item.deviatingTools.map((t) => (
                        <span key={t} className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-destructive">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        navigate({ to: "/enforce/checks", search: { id: item.checkId } });
                      }}
                    >
                      Open in Checks
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onResolve(item.id);
                        toast("Snoozed — deviation still tracked in Checks");
                      }}
                    >
                      Snooze
                    </Button>
                  </div>
                </>
              )}

              {item.kind === "no-standard" && (
                <>
                  <p className="text-sm text-foreground/85">
                    No governed definition yet. Tools are answering this on their own.
                  </p>
                  <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-[11px] text-foreground/80">
                    Asked <span className="font-mono">{item.frequencyScore}×/week</span> across connected tools.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        navigate({ to: "/enforce/checks", search: { id: item.checkId } });
                      }}
                    >
                      Set a standard
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onResolve(item.id);
                        toast("Dismissed");
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </>
              )}
            </div>

                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
