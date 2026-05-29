import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  suggestDefinitionDrafts,
  suggestDriftAlerts,
  suggestImprovements,
  type DefinitionDraftSuggestion,
  type DriftSuggestion,
  type ImprovementSuggestion,
} from "./engine";
import { definitions } from "./mock-data";
import { SEED_CHECKS } from "./referee/mock-checks";
import type { Check } from "./referee/types";


// ── Item types ────────────────────────────────────────────────────────────

export type InboxKind =
  | "drift"
  | "draft"
  | "improvement"
  | "sync-failure"
  | "review-request"
  | "deviation"
  | "no-standard";

export interface BaseInboxItem {
  id: string;
  kind: InboxKind;
  title: string;
  source: string; // "Engine", "Finance", "Sam", "Snowflake"
  ageHours: number;
}

export interface DriftInboxItem extends BaseInboxItem {
  kind: "drift";
  payload: DriftSuggestion;
  definitionName: string;
}

export interface DraftInboxItem extends BaseInboxItem {
  kind: "draft";
  payload: DefinitionDraftSuggestion;
}

export interface ImprovementInboxItem extends BaseInboxItem {
  kind: "improvement";
  payload: ImprovementSuggestion;
  definitionName: string;
}

export interface SyncFailureInboxItem extends BaseInboxItem {
  kind: "sync-failure";
  connector: string;
  detail: string;
}

export interface ReviewRequestInboxItem extends BaseInboxItem {
  kind: "review-request";
  definitionId: string;
  definitionName: string;
  requester: string;
  note: string;
}

export interface DeviationInboxItem extends BaseInboxItem {
  kind: "deviation";
  checkId: string;
  question: string;
  causeNote: string;
  deviatingTools: string[];
}

export interface NoStandardInboxItem extends BaseInboxItem {
  kind: "no-standard";
  checkId: string;
  question: string;
  frequencyScore: number;
}

export type InboxItem =
  | DriftInboxItem
  | DraftInboxItem
  | ImprovementInboxItem
  | SyncFailureInboxItem
  | ReviewRequestInboxItem
  | DeviationInboxItem
  | NoStandardInboxItem;


// ── Resolved IDs (localStorage) ───────────────────────────────────────────

const KEY = "clearmetric:inbox-resolved";
const EVENT = "clearmetric:inbox-changed";

function readResolved(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeResolved(set: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const h = () => cb();
  window.addEventListener(EVENT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVENT, h);
    window.removeEventListener("storage", h);
  };
}

// ── Build the queue ───────────────────────────────────────────────────────

function buildAll(): InboxItem[] {
  const items: InboxItem[] = [];

  const defById = new Map(definitions.map((d) => [d.id, d]));

  for (const s of suggestDriftAlerts(definitions)) {
    const d = defById.get(s.definitionId);
    items.push({
      id: s.id,
      kind: "drift",
      title: `${d?.name ?? "Metric"} drifted from source`,
      source: d?.owner ?? "Engine",
      ageHours: 2,
      payload: s,
      definitionName: d?.name ?? "Metric",
    });
  }

  for (const s of suggestDefinitionDrafts()) {
    items.push({
      id: s.id,
      kind: "draft",
      title: `Draft: ${s.draft.name}`,
      source: "Engine",
      ageHours: 4,
      payload: s,
    });
  }

  for (const s of suggestImprovements(definitions)) {
    const d = defById.get(s.definitionId);
    items.push({
      id: s.id,
      kind: "improvement",
      title: s.title,
      source: "Engine",
      ageHours: 26,
      payload: s,
      definitionName: d?.name ?? "Metric",
    });
  }

  // Mock sync failure
  items.push({
    id: "sync_snowflake_1",
    kind: "sync-failure",
    title: "Snowflake sync failed",
    source: "Snowflake",
    ageHours: 24,
    connector: "Snowflake / Events",
    detail:
      "Last attempt 24h ago returned 403. Refresh credentials in Settings → Connections to resume drift checks.",
  });

  // Mock review request
  items.push({
    id: "review_nps_1",
    kind: "review-request",
    title: "Review requested: NPS",
    source: "Sam Patel",
    ageHours: 48,
    definitionId: "def_nps",
    definitionName: "NPS",
    requester: "Sam Patel",
    note: "Want to publish this so the Q4 board deck can cite it. Looks right to me — second pair of eyes?",
  });

  // Deviations + no-standard from referee checks store (derived, not duplicated).
  // Truncate to the most-asked few so Checks page remains the deep view.
  const deviating = SEED_CHECKS.filter((c: Check) => c.status === "deviating")
    .sort((a: Check, b: Check) => b.frequencyScore - a.frequencyScore);
  for (const c of deviating) {
    const deviatingTools = c.toolResults
      .filter((r) => r.verdict === "deviates")
      .map((r) => r.tool);
    items.push({
      id: `dev_${c.id}`,
      kind: "deviation",
      title: c.questionText,
      source: deviatingTools.length === 1 ? deviatingTools[0] : `${deviatingTools.length} tools`,
      ageHours: 6,
      checkId: c.id,
      question: c.questionText,
      causeNote: c.causeNote ?? "Tools disagree on this metric.",
      deviatingTools,
    });
  }

  const noStandard = SEED_CHECKS.filter((c: Check) => c.status === "no_standard")
    .sort((a: Check, b: Check) => b.frequencyScore - a.frequencyScore)
    .slice(0, 2); // only surface the most-asked; the rest live on Checks page
  for (const c of noStandard) {
    items.push({
      id: `nostd_${c.id}`,
      kind: "no-standard",
      title: c.questionText,
      source: "Engine",
      ageHours: 12,
      checkId: c.id,
      question: c.questionText,
      frequencyScore: c.frequencyScore,
    });
  }

  return items;
}


// Stable snapshot — built once per module load. Mock data is deterministic.
const ALL_ITEMS = buildAll();

// ── Hook ──────────────────────────────────────────────────────────────────

export function useInbox() {
  const resolvedJson = useSyncExternalStore(
    subscribe,
    () => JSON.stringify([...readResolved()]),
    () => "[]",
  );

  const resolved = useMemo<Set<string>>(
    () => new Set(JSON.parse(resolvedJson)),
    [resolvedJson],
  );

  const open = useMemo(
    () => ALL_ITEMS.filter((i) => !resolved.has(i.id)),
    [resolved],
  );
  const resolvedItems = useMemo(
    () => ALL_ITEMS.filter((i) => resolved.has(i.id)),
    [resolved],
  );

  const resolve = useCallback((id: string) => {
    const s = readResolved();
    s.add(id);
    writeResolved(s);
  }, []);

  const unresolve = useCallback((id: string) => {
    const s = readResolved();
    s.delete(id);
    writeResolved(s);
  }, []);

  return {
    all: ALL_ITEMS,
    open,
    resolved: resolvedItems,
    openCount: open.length,
    resolve,
    unresolve,
  };
}
