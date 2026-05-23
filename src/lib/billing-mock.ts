import { useSyncExternalStore } from "react";

export type Plan = {
  id: "free" | "starter" | "team" | "business";
  name: string;
  price: string;
  monthlyCredits: number;
  sources: string;
};

export const PLANS: Plan[] = [
  { id: "free", name: "Free", price: "$0", monthlyCredits: 500, sources: "1 source" },
  { id: "starter", name: "Starter", price: "$49/mo", monthlyCredits: 10_000, sources: "3 sources" },
  { id: "team", name: "Team", price: "$299/mo", monthlyCredits: 75_000, sources: "10 sources" },
  { id: "business", name: "Business", price: "$999/mo", monthlyCredits: 300_000, sources: "Unlimited" },
];

export const TOP_UPS = [
  { credits: 5_000, price: "$25" },
  { credits: 20_000, price: "$90" },
  { credits: 100_000, price: "$400" },
];

export const BREAKDOWN_TEAM = {
  Drafts: 2340,
  "Drift checks": 1820,
  Improvements: 1290,
  Syncs: 797,
};

export type Scenario = "healthy" | "warning" | "hit";

export type Role = "owner" | "admin" | "editor" | "viewer";

export const ROLES: { id: Role; name: string; blurb: string }[] = [
  { id: "owner", name: "Owner", blurb: "Full access, including billing" },
  { id: "admin", name: "Admin", blurb: "Manage workspace and billing" },
  { id: "editor", name: "Editor", blurb: "Define and experiment, no billing" },
  { id: "viewer", name: "Viewer", blurb: "Read-only access" },
];

export function canSeeBilling(role: Role): boolean {
  return role === "owner" || role === "admin";
}

const KEY_SCENARIO = "clearmetric:billing-scenario";
const KEY_PLAN = "clearmetric:billing-plan";
const KEY_BONUS = "clearmetric:billing-bonus";
const KEY_ROLE = "clearmetric:role";
const EVENT = "clearmetric:billing-changed";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

let snapshotCache = "";
let snapshotValue: ReturnType<typeof compute> | null = null;

function compute() {
  const scenario = read<Scenario>(KEY_SCENARIO, "healthy");
  const planId = read<Plan["id"]>(KEY_PLAN, "team");
  const bonus = read<number>(KEY_BONUS, 0);
  const role = read<Role>(KEY_ROLE, "owner");
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[2];

  const pct = scenario === "healthy" ? 0.62 : scenario === "warning" ? 0.85 : 1;
  const baseUsed = Math.round(plan.monthlyCredits * pct);
  const totalCredits = plan.monthlyCredits + bonus;
  const used = Math.min(baseUsed, totalCredits);

  return { scenario, plan, used, total: totalCredits, bonus, role };
}

export function useBilling() {
  return useSyncExternalStore(
    subscribe,
    () => {
      const next = compute();
      const json = JSON.stringify(next);
      if (json !== snapshotCache) {
        snapshotCache = json;
        snapshotValue = next;
      }
      return snapshotValue!;
    },
    () => compute(),
  );
}

export function setScenario(s: Scenario) {
  write(KEY_SCENARIO, s);
}

export function setPlan(id: Plan["id"]) {
  write(KEY_PLAN, id);
}

export function setRole(r: Role) {
  write(KEY_ROLE, r);
}

export function addBonus(credits: number) {
  const current = read<number>(KEY_BONUS, 0);
  write(KEY_BONUS, current + credits);
}

export function formatK(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return n.toString();
}
