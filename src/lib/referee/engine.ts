// Mock conformance engine. Three pure functions that demonstrate the §5
// cost-engine story without any real warehouse or AI calls.
import type { Check, MetadataObject, Run } from "./types";
import { METADATA } from "./mock-checks";

/** Compare two metadata snapshots; return changed object ids. */
export function diffMetadata(
  prev: MetadataObject[],
  next: MetadataObject[],
): string[] {
  const prevMap = new Map(prev.map((o) => [o.id, o.contentHash]));
  const changed: string[] = [];
  for (const o of next) {
    if (prevMap.get(o.id) !== o.contentHash) changed.push(o.id);
  }
  return changed;
}

/** Checks whose fingerprint intersects the changed metadata objects. */
export function affectedChecks(checks: Check[], changedIds: string[]): Check[] {
  if (changedIds.length === 0) return [];
  const changed = new Set(changedIds);
  return checks.filter((c) => c.fingerprint.some((id) => changed.has(id)));
}

/**
 * Simulate a metadata change against the seed catalog.
 * Returns the changed object ids + the affected checks — never makes AI calls
 * unless something actually changed. This is the demo of §5.
 */
export function simulateMetadataChange(
  checks: Check[],
  objectId: string,
): { changedIds: string[]; affected: Check[]; run: Run } {
  const target = METADATA.find((m) => m.id === objectId);
  const changedIds = target ? [target.id] : [];
  const affected = affectedChecks(checks, changedIds);
  const now = new Date().toISOString();
  return {
    changedIds,
    affected,
    run: {
      id: `run_${Date.now()}`,
      trigger: "metadata_change",
      startedAt: now,
      finishedAt: now,
      affectedCheckIds: affected.map((c) => c.id),
      // 1 AI call per affected check × tool with results
      costUnits: affected.reduce((sum, c) => sum + c.toolResults.length * 10, 0),
    },
  };
}
