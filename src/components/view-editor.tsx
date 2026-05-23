import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FIELD_LABELS,
  FIELD_OPS,
  defaultValueFor,
  newRuleId,
  newViewId,
  uniqueValues,
  type Rule,
  type RuleField,
  type RuleOp,
  type View,
} from "@/lib/views";
import type { Definition } from "@/lib/mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defs: Definition[];
  initial?: View | null;
  onSave: (view: View) => void;
}

const FIELDS: RuleField[] = [
  "name",
  "owner",
  "source",
  "domain",
  "status",
  "serveToAi",
  "driftFlag",
];

export function ViewEditor({ open, onOpenChange, defs, initial, onSave }: Props) {
  const [name, setName] = useState("");
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setRules(
        initial?.rules ?? [
          { id: newRuleId(), field: "domain", op: "is", value: defaultValueFor("domain", defs) },
        ],
      );
    }
  }, [open, initial, defs]);

  const updateRule = (id: string, patch: Partial<Rule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRule = () =>
    setRules((prev) => [
      ...prev,
      { id: newRuleId(), field: "owner", op: "is", value: defaultValueFor("owner", defs) },
    ]);

  const removeRule = (id: string) =>
    setRules((prev) => prev.filter((r) => r.id !== id));

  const canSave = name.trim().length > 0 && rules.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: initial?.id ?? newViewId(),
      name: name.trim(),
      rules,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            {initial ? "Edit view" : "New view"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Name
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Finance · drift"
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Match all of these
            </div>
            <div className="space-y-1.5">
              {rules.map((r) => {
                const ops = FIELD_OPS[r.field];
                const values = uniqueValues(r.field, defs);
                return (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <Select
                      value={r.field}
                      onValueChange={(v) => {
                        const field = v as RuleField;
                        updateRule(r.id, {
                          field,
                          op: FIELD_OPS[field][0],
                          value: defaultValueFor(field, defs),
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELDS.map((f) => (
                          <SelectItem key={f} value={f} className="text-xs">
                            {FIELD_LABELS[f]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={r.op}
                      onValueChange={(v) => updateRule(r.id, { op: v as RuleOp })}
                      disabled={ops.length === 1}
                    >
                      <SelectTrigger className="h-8 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ops.map((op) => (
                          <SelectItem key={op} value={op} className="text-xs">
                            {op === "contains" ? "contains" : op === "is" ? "is" : "is not"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {r.field === "name" ? (
                      <Input
                        value={r.value}
                        onChange={(e) => updateRule(r.id, { value: e.target.value })}
                        placeholder="text…"
                        className="h-8 flex-1 text-xs"
                      />
                    ) : (
                      <Select
                        value={r.value}
                        onValueChange={(v) => updateRule(r.id, { value: v })}
                      >
                        <SelectTrigger className="h-8 flex-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {values.map((v) => (
                            <SelectItem key={v} value={v} className="text-xs">
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <button
                      onClick={() => removeRule(r.id)}
                      className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Remove rule"
                      disabled={rules.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={addRule}
              className="mt-2 inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              Add rule
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!canSave}>
            {initial ? "Save changes" : "Create view"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
