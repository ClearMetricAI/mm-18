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
import {
  Database,
  FlaskConical,
  PlugZap,
  Activity,
  ArrowRight,
} from "lucide-react";
import { definitions } from "@/lib/mock-data";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        // Don't hijack ⌘K when a search input is already focused on the page
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        if ((tag === "INPUT" || tag === "TEXTAREA") && !open) {
          // allow page-level ⌘K to focus its own search
          return;
        }
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
      <CommandInput placeholder="Jump to a definition, page, or action…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => go(() => navigate({ to: "/connect" }))}>
            <PlugZap className="mr-2 h-4 w-4" /> Connect
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/define" }))}>
            <Database className="mr-2 h-4 w-4" /> Define
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/experiment" }))}>
            <FlaskConical className="mr-2 h-4 w-4" /> Experiment
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/serve" }))}>
            <Activity className="mr-2 h-4 w-4" /> Serve
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Test a definition">
          {definitions.slice(0, 40).map((d) => (
            <CommandItem
              key={`test-${d.id}`}
              value={`test ${d.name} ${d.domain}`}
              onSelect={() =>
                go(() =>
                  navigate({ to: "/experiment", search: { def: d.id } as never }),
                )
              }
            >
              <FlaskConical className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="flex-1 truncate">{d.name}</span>
              <span className="ml-2 text-[10px] text-muted-foreground">{d.domain}</span>
              <ArrowRight className="ml-2 h-3 w-3 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Open definition">
          {definitions.slice(0, 40).map((d) => (
            <CommandItem
              key={`open-${d.id}`}
              value={`open ${d.name} ${d.owner}`}
              onSelect={() => go(() => navigate({ to: "/define" }))}
            >
              <Database className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="flex-1 truncate">{d.name}</span>
              <span className="ml-2 text-[10px] text-muted-foreground">{d.owner}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
