import type { Definition } from "@/lib/mock-data";

export type RuleField =
  | "name"
  | "owner"
  | "source"
  | "domain"
  | "status"
  | "serveToAi"
  | "driftFlag";

export type RuleOp = "contains" | "is" | "isNot";

export interface Rule {
  id: string;
  field: RuleField;
  op: RuleOp;
  value: string; // for boolean fields, "true" | "false"
}

export interface View {
  id: string;
  name: string;
  rules: Rule[];
}

export const FIELD_LABELS: Record<RuleField, string> = {
  name: "Name",
  owner: "Owner",
  source: "Source",
  domain: "Domain",
  status: "Status",
  serveToAi: "Served to AI",
  driftFlag: "Has drift",
};

export const FIELD_OPS: Record<RuleField, RuleOp[]> = {
  name: ["contains"],
  owner: ["is", "isNot"],
  source: ["is", "isNot"],
  domain: ["is", "isNot"],
  status: ["is"],
  serveToAi: ["is"],
  driftFlag: ["is"],
};

export function defaultValueFor(field: RuleField, defs: Definition[]): string {
  switch (field) {
    case "name":
      return "";
    case "status":
      return "approved";
    case "serveToAi":
    case "driftFlag":
      return "true";
    case "owner":
      return defs[0]?.owner ?? "";
    case "source":
      return defs[0]?.source ?? "";
    case "domain":
      return defs[0]?.domain ?? "";
  }
}

export function uniqueValues(field: RuleField, defs: Definition[]): string[] {
  if (field === "status") return ["draft", "approved", "tested"];
  if (field === "serveToAi" || field === "driftFlag") return ["true", "false"];
  if (field === "name") return [];
  const set = new Set<string>();
  for (const d of defs) {
    const v = d[field as "owner" | "source" | "domain"];
    if (v) set.add(v);
  }
  return Array.from(set).sort();
}

function ruleMatches(def: Definition, rule: Rule): boolean {
  const v = rule.value;
  switch (rule.field) {
    case "name":
      return def.name.toLowerCase().includes(v.toLowerCase());
    case "owner":
      return rule.op === "isNot" ? def.owner !== v : def.owner === v;
    case "source":
      return rule.op === "isNot" ? def.source !== v : def.source === v;
    case "domain":
      return rule.op === "isNot" ? def.domain !== v : def.domain === v;
    case "status":
      return def.status === v;
    case "serveToAi":
      return def.serveToAi === (v === "true");
    case "driftFlag":
      return Boolean(def.driftFlag) === (v === "true");
  }
}

export function matchesView(def: Definition, view: View): boolean {
  return view.rules.every((r) => ruleMatches(def, r));
}

const STORAGE_KEY = "clearmetric.views.v1";

export function loadViews(): View[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveViews(views: View[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  window.dispatchEvent(new Event("clearmetric:views-changed"));
}

export function newViewId() {
  return `view_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function newRuleId() {
  return `rule_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
