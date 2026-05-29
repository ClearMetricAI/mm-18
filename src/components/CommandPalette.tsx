import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Database, Settings, Inbox, ShieldCheck, ArrowRight, Zap, HelpCircle } from "lucide-react";
import { definitions } from "@/lib/mock-data";
import { SEED_CHECKS } from "@/lib/referee/mock-checks";


export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        if ((tag === "INPUT" || tag === "TEXTAREA") && !open) return;
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a definition or page…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => go(() => navigate({ to: "/" }))}>
            <Inbox className="mr-2 h-4 w-4" /> Inbox
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/define" }))}>
            <Database className="mr-2 h-4 w-4" /> Define
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/enforce/checks" }))}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Enforce · Checks
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/settings" }))}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Checks">
          <CommandItem
            onSelect={() =>
              go(() => navigate({ to: "/enforce/checks", search: {} }))
            }
          >
            <Zap className="mr-2 h-4 w-4 text-destructive" /> Jump to deviating checks
          </CommandItem>
          {SEED_CHECKS.slice(0, 12).map((c) => (
            <CommandItem
              key={`chk-${c.id}`}
              value={`check ${c.questionText}`}
              onSelect={() =>
                go(() => navigate({ to: "/enforce/checks", search: { id: c.id } }))
              }
            >
              {c.status === "no_standard" ? (
                <HelpCircle className="mr-2 h-4 w-4 text-warning" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4 text-muted-foreground" />
              )}
              <span className="flex-1 truncate">{c.questionText}</span>
              <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                {c.frequencyScore}/wk
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />


        <CommandGroup heading="Open definition">
          {definitions.slice(0, 40).map((d) => (
            <CommandItem
              key={`open-${d.id}`}
              value={`open ${d.name} ${d.owner}`}
              onSelect={() =>
                go(() => navigate({ to: "/define", search: { id: d.id } }))
              }
            >
              <Database className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="flex-1 truncate">{d.name}</span>
              <span className="ml-2 text-[10px] text-muted-foreground">{d.owner}</span>
              <ArrowRight className="ml-2 h-3 w-3 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
