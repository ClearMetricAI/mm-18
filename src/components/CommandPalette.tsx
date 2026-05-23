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
import { BookOpen, Database, FlaskConical, Radio, Hash } from "lucide-react";
import { definitions } from "@/lib/mock-data";

const pages = [
  { to: "/define", label: "Define", icon: BookOpen },
  { to: "/experiment", label: "Experiment", icon: FlaskConical },
  { to: "/serve", label: "Serve", icon: Radio },
  { to: "/connect", label: "Connect", icon: Database },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        const target = e.target as HTMLElement | null;
        // Don't hijack when typing in an input
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a metric or page…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem
              key={p.to}
              onSelect={() => go(() => navigate({ to: p.to }))}
              value={`page ${p.label}`}
            >
              <p.icon className="mr-2 h-4 w-4" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={`Definitions (${definitions.length})`}>
          {definitions.slice(0, 200).map((d) => (
            <CommandItem
              key={d.id}
              value={`${d.name} ${d.domain} ${d.owner}`}
              onSelect={() =>
                go(() => navigate({ to: "/m/$defId", params: { defId: d.id } as never }))
              }
            >
              <Hash className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1">{d.name}</span>
              <span className="ml-2 text-[10px] text-muted-foreground">{d.domain}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
