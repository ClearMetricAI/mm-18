# Plan: Inbox as the front door

You want industry best practice + Experiment and Serve stay as top-level. The best-practice pattern for tools with engine-generated work (Linear, Height, Sentry, PagerDuty, Datadog) is **Inbox-as-home**: the app opens to a single queue of things that need a human, and the rest of the nav is the *work* you do once the queue is clear.

So: replace Home with Inbox. Keep Define, Experiment, Serve, Settings. Remove the duplicate Inbox tab inside Define.

---

## Sidebar (final)

```text
Inbox      (12)
Define
Experiment
Serve
─────────
Settings
```

- **Inbox** is the new `/` route. Badge = unresolved count.
- **Define / Experiment / Serve** unchanged as destinations.
- Role-gated credit meter + Pricing link stay in the footer (existing behavior).

---

## Inbox page (`/`)

```text
Inbox
Each item is one decision. Resolve and move on.

  Open 12   Resolved   All
  ──────
  🔍 Search                              [Filter]
  ─────────────────────────────────────────────
  ⚠️  Revenue drifted from source       Finance · 2h
  ✨  Draft: Churn rate                  Engine  · 4h
  🔌  Snowflake sync failed                       1d
  ✨  Improve ARR formula                Engine  · 1d
  📝  Review requested: NPS              Sam     · 2d
  ...
```

- One unified queue, mixed item types.
- Each row = one decision: icon · title · source/owner · age.
- Click row → right-side sheet opens with the full review card (drift / draft / improvement) OR routes to the source page (sync → Settings; review → Define detail).
- Resolve / Dismiss inline where possible. Resolved items move to the Resolved tab.
- Empty state: "Inbox zero. Nothing needs you."

### Item types in v1

| Icon | Type        | Resolution                            |
|------|-------------|---------------------------------------|
| ⚠️   | Drift       | Acknowledge / open definition         |
| ✨   | Draft       | Accept (creates def) / dismiss        |
| ✨   | Improvement | Apply / dismiss                       |
| 🔌   | Sync fail   | Open Settings → Connections (mocked)  |
| 📝   | Review req. | Open definition in review mode (mocked)|

Drift / drafts / improvements come from existing `src/lib/engine.ts`. Sync and review are mocked for v1 so the inbox feels real.

---

## Define page (`/define`)

- **Remove the Inbox tab and all three SectionGroup blocks** (drift / drafts / improvements). Their logic moves to Inbox.
- Page becomes the Library only: search + list + accordion-or-detail row (master-detail refactor is a separate plan if you want it later).
- Saved views (`?view=…`) keep working.

---

## What gets cut

- `src/routes/index.tsx` placeholder
- Define's `tab` state, `inbox` branch, and the `Sparkles`/`AlertTriangle` SectionGroup blocks
- `UsageBanner` on Define (banners live on Inbox + Settings only; not duplicated)

## What stays

- Engine logic in `src/lib/engine.ts` — only the UI surface moves
- Role gating, theme toggle, billing footer, scenario switching
- Experiment and Serve routes, unchanged

---

## Technical sketch

1. **New** `src/components/inbox/InboxItem.tsx` — row component (icon + title + meta + click handler).
2. **New** `src/components/inbox/InboxList.tsx` — owns the queue, tabs (Open/Resolved/All), search, filter chips, empty state.
3. **New** `src/components/inbox/InboxSheet.tsx` — right-side `Sheet` that hosts the resolve UI per item type (reuses `ReviewCard`).
4. **Extend** `src/lib/engine.ts` with two new mock item kinds: `sync-failure`, `review-request`. Add a `useInboxItems()` hook that aggregates suggestions + mocks + reads/writes resolved IDs from localStorage.
5. **Rewrite** `src/routes/index.tsx` to render `<InboxList />`.
6. **Edit** `src/routes/define.tsx` — strip the Inbox tab, keep the Library branch as the default render.
7. **Edit** `src/components/AppSidebar.tsx` — add Inbox link with badge (count from `useInboxItems()`); reorder so Inbox is first.

---

## Out of scope (deliberate)

- Master-detail refactor of `/define` (separate plan if you want it).
- Real backends for sync / review items — mocked.
- Bulk resolve, multi-select, keyboard shortcuts on the queue — defer.
- Notification badges outside the app.

---

## Why this is the right call (and not the others)

- **Vs. "one page" (Option A)**: you said keep Experiment and Serve as top-level. Inbox-on-top-of-Define stops being honest when the inbox also covers sync, billing, team reviews. A dedicated Inbox scales; an embedded strip doesn't.
- **Vs. "just rename Home" (Option C)**: same UI shape but the duplicate Inbox tab inside Define is the real source of confusion. This plan fixes that.
- **Vs. your screenshot**: same destination, simpler chrome — no "0 tables · 0 measures" meta strip, no Filter button when the list is empty, no Catalog/Lineage nav until those features actually exist.

## Success check

- New user opens app → lands on Inbox → sees a clear list of things to do.
- "Where do I triage?" has one answer: Inbox.
- Define has one job (browse + edit). Inbox has one job (resolve).
- Sidebar count == reality. Resolving an item decrements it immediately.
