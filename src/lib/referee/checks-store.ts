import { useCallback, useMemo, useSyncExternalStore } from "react";
import { SEED_CHECKS } from "./mock-checks";
import type { Check, CheckStatus } from "./types";

const EVENT = "referee:checks-changed";

// In-memory store (no persistence in v1 — checks are derived from mock seeds
// plus user actions in this session).
let _checks: Check[] = SEED_CHECKS;
let _version = 0;

function emit() {
  _version += 1;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function useChecks() {
  useSyncExternalStore(
    subscribe,
    () => _version,
    () => 0,
  );

  const counts = useMemo(() => {
    const c = { deviating: 0, no_standard: 0, conforming: 0, all: _checks.length };
    for (const chk of _checks) c[chk.status] += 1;
    return c;
  }, []);

  const byStatus = useCallback(
    (status: CheckStatus | "all") =>
      status === "all" ? _checks : _checks.filter((c) => c.status === status),
    [],
  );

  const get = useCallback((id: string) => _checks.find((c) => c.id === id) ?? null, []);

  const setStandard = useCallback((checkId: string, definitionId: string) => {
    _checks = _checks.map((c) =>
      c.id === checkId
        ? { ...c, definitionId, status: "conforming" as const }
        : c,
    );
    emit();
  }, []);

  const acknowledge = useCallback((checkId: string) => {
    _checks = _checks.map((c) =>
      c.id === checkId ? { ...c, status: "conforming" as const } : c,
    );
    emit();
  }, []);

  return { checks: _checks, counts, byStatus, get, setStandard, acknowledge };
}
