import { useSyncExternalStore, useCallback } from "react";
import { loadViews, saveViews, type View } from "./views";

const EVENT = "clearmetric:views-changed";

function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useViews() {
  const views = useSyncExternalStore(
    subscribe,
    () => {
      // cache snapshot string to keep referential stability
      const json = JSON.stringify(loadViews());
      return json;
    },
    () => "[]",
  );

  const parsed: View[] = JSON.parse(views);

  const upsert = useCallback((v: View) => {
    const current = loadViews();
    const idx = current.findIndex((x) => x.id === v.id);
    if (idx === -1) current.push(v);
    else current[idx] = v;
    saveViews(current);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const remove = useCallback((id: string) => {
    saveViews(loadViews().filter((v) => v.id !== id));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const rename = useCallback((id: string, name: string) => {
    const current = loadViews();
    const v = current.find((x) => x.id === id);
    if (!v) return;
    v.name = name;
    saveViews(current);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { views: parsed, upsert, remove, rename };
}
