import { useSyncExternalStore } from "react";

export type BaselineFile = { name: string; size: number };
export type Baseline = {
  id: string;
  name: string;
  systemPrompt: string;
  extraContext: string;
  files: BaselineFile[];
  selected: boolean;
  locked?: boolean; // cannot delete (the "cold" default)
};

const STORAGE_KEY = "cm.baselines.v1";

const seed: Baseline[] = [
  {
    id: "cold",
    name: "Cold model",
    systemPrompt: "",
    extraContext: "",
    files: [],
    selected: true,
    locked: true,
  },
  {
    id: "production",
    name: "Production agent",
    systemPrompt:
      "You are a data analyst at Contoso. Answer using our finance conventions and the tables you have access to.",
    extraContext:
      "Schema: orders(id, amount_cents, refunded, country), customers(id, segment).\nGlossary: 'revenue' = sum(amount_cents) where refunded=false.",
    files: [],
    selected: false,
  },
];

let state: Baseline[] = load();
const listeners = new Set<() => void>();

function load(): Baseline[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Baseline[];
    return parsed.length ? parsed : seed;
  } catch {
    return seed;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

export function useBaselines() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const baselinesApi = {
  add(): Baseline {
    const b: Baseline = {
      id: `b_${Date.now()}`,
      name: "Untitled baseline",
      systemPrompt: "",
      extraContext: "",
      files: [],
      selected: false,
    };
    state = [...state, b];
    emit();
    return b;
  },
  update(id: string, patch: Partial<Baseline>) {
    state = state.map((b) => (b.id === id ? { ...b, ...patch } : b));
    emit();
  },
  remove(id: string) {
    state = state.filter((b) => b.id !== id || b.locked);
    emit();
  },
  toggle(id: string) {
    state = state.map((b) => (b.id === id ? { ...b, selected: !b.selected } : b));
    emit();
  },
  setSelected(ids: string[]) {
    const set = new Set(ids);
    state = state.map((b) => ({ ...b, selected: set.has(b.id) }));
    emit();
  },
};

export function getSelectedBaselines(): Baseline[] {
  return state.filter((b) => b.selected);
}
