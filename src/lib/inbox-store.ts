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

// ── Item types ────────────────────────────────────────────────────────────

export type InboxKind =
  | "drift"
  | "draft"
  | "improvement"
  | "sync-failure"
  | "review-request";

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

export type InboxItem =
  | DriftInboxItem
  | DraftInboxItem
  | ImprovementInboxItem
  | SyncFailureInboxItem
  | ReviewRequestInboxItem;

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
