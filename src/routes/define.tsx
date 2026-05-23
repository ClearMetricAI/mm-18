import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, ChevronRight, Share2, FlaskConical, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { definitions as seedDefs, type Definition } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/define")({ component: DefinePage });

function DefinePage() {
  const navigate = useNavigate();
  const [defs, setDefs] = useState<Definition[]>(seedDefs);
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState<string>("all");
  const [served, setServed] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const owners = useMemo(() => Array.from(new Set(seedDefs.map((d) => d.owner))), []);

  const filtered = defs.filter((d) => {
    const q = query.toLowerCase();
    const matchesQ = !q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
    const matchesOwner = owner === "all" || d.owner === owner;
    const matchesServed =
      served === "all" || (served === "served" ? d.serveToAi : !d.serveToAi);
    return matchesQ && matchesOwner && matchesServed;
  });

  const servedCount = defs.filter((d) => d.serveToAi).length;

  const toggleServe = (id: string) => {
    setDefs((prev) => prev.map((d) => (d.id === id ? { ...d, serveToAi: !d.serveToAi } : d)));
  };

  return (
    <div>
      <PageHeader
        title="Define"
        description="The shared dictionary of what every metric means."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Share2 className="mr-1 h-3.5 w-3.5" />
              Share
            </Button>
            <Button size="sm">
              <Plus className="mr-1 h-3.5 w-3.5" />
              New
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-2 border-b border-border px-8 py-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search definitions…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={served} onValueChange={setServed}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="served">Served</SelectItem>
            <SelectItem value="not_served">Not served</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-xs text-muted-foreground">
          {defs.length} defs · {servedCount} served
        </div>
      </div>

      <div className="px-8 py-2">
        <div className="grid grid-cols-[1fr_180px_90px_110px_90px] items-center border-b border-border px-2 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <div>Definition</div>
          <div>Owner</div>
          <div>Status</div>
          <div>Confirmed</div>
          <div className="text-right">Serve to AI</div>
        </div>

        {filtered.map((d) => {
          const isOpen = expanded === d.id;
          return (
            <div key={d.id} className="border-b border-border">
              <button
                onClick={() => setExpanded(isOpen ? null : d.id)}
                className="grid w-full grid-cols-[1fr_180px_90px_110px_90px] items-center px-2 py-2.5 text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-90",
                    )}
                  />
                  <span className="truncate font-medium">{d.name}</span>
                </div>
                <div className="truncate text-sm text-muted-foreground">{d.owner}</div>
                <div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] font-normal",
                      d.status === "tested" && "bg-[var(--success)]/10 text-[var(--success)]",
                    )}
                  >
                    {d.status === "tested" ? "Tested" : "Draft"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{d.confirmedAt ?? "—"}</div>
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <Switch checked={d.serveToAi} onCheckedChange={() => toggleServe(d.id)} />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border bg-muted/30 px-10 py-5">
                  <div className="grid gap-5">
                    <div>
                      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Description
                      </div>
                      <p className="text-sm leading-relaxed">{d.description}</p>
                    </div>
                    <div>
                      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Formula
                      </div>
                      <pre className="overflow-x-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-xs">
                        {d.formula}
                      </pre>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Used in
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {d.usedIn.map((u) => (
                            <Badge key={u} variant="outline" className="text-[10px] font-normal">
                              {u}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Source
                        </div>
                        <div className="text-sm text-muted-foreground">{d.source}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline">
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="mr-1 h-3.5 w-3.5" /> Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({ to: "/experiment", search: { def: d.id } as never })}
                      >
                        <FlaskConical className="mr-1 h-3.5 w-3.5" /> Run AI test
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-2 py-12 text-center text-sm text-muted-foreground">No definitions match.</div>
        )}
      </div>
    </div>
  );
}
