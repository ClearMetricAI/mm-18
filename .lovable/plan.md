## Reframe

The previous plan read the spec/mock as a target to **reproduce**. Wrong frame. The existing app already has a working IA (Inbox · Define · Views · Billing · Inbox-sheet review flow), a credit/billing story, a command palette, an inbox store, a definitions store, and — already shipped — a referee data layer (`src/lib/referee/`) and a Checks page scaffold (`src/routes/enforce.checks.tsx`, `src/components/checks/*`).

So Slice 1 is mostly **on disk**. What's missing is **integration** — making Checks feel like a native surface of *this* app, not a port of the HTML mock. That's what this revised plan covers.

---

## Integration principles

1. **One mental model, not two.** Definitions and Checks are two views of the same fact: "is the org's truth being honored?" A deviation is an inbox item. A check without a standard is a draft definition waiting to happen. Wire those edges; don't make Checks a parallel universe.
2. **Reuse our primitives.** `InboxItem` / `InboxSheet`, `ReviewCard`, `CommandPalette`, `CreditMeter`, `useViews`, `PageHeader`, the dropdown/sheet patterns from Define. The Checks page should feel like a sibling of Define, not a transplant.
3. **The mock is a reference, not a spec.** Its tokens (`--ok/--warn/--bad`), two-pane shape, and verdict cards are good. Its exact pixel grid, custom CSS vars, and standalone chrome are not — translate into our tailwind tokens, shadcn primitives, and existing sidebar/header.
4. **Don't duplicate stores.** `checks-store` already exists alongside `inbox-store`. Cross-link them (one deviation → one inbox item) instead of running two parallel queues.

---

## What's already done (verified on disk)

- `src/lib/referee/{types,engine,checks-store,mock-checks}.ts`
- `src/components/checks/{CheckQueue,CheckDetail,ToolResultCard}.tsx`
- `src/routes/enforce.checks.tsx` (83 lines — composes the two panes)
- Sidebar already rebranded to **Referee**, Enforce group present, Suites greyed, deviating-count badge wired to `useChecks`.

So we are **past** the "build the shell" step. The actual work is the seams.

---

## Slice 1.5 — the seams (this build)

### A. Inbox ↔ Checks bridge
- Extend `inbox-store` item kinds with `deviation` and `no-standard`. Seed from `checks-store` on first load (derive, don't duplicate).
- `InboxSheet` for a deviation item: render `<CheckDetail/>` inline (same component, no fork). "Resolve" closes the inbox item *and* updates the check (govern / adopt / dismiss).
- Inbox badge already counts open items; deviations now contribute to it. Single number, single triage queue.

### B. Define ↔ Checks bridge
- Definition detail gains: **"Checks using this" count + link** (filter `/enforce/checks?defId=…`). No new page.
- When a check's "Set a standard → Govern in Define" is chosen, prefill `ViewEditor`/definition draft from the check's question + returned query. Reuse the existing editor; don't build a parallel authoring flow.
- Lifecycle (`draft / in_review / governed`) and `fingerprint` chips added to the existing definition card — visual additions only, no IA change.

### C. Checks page polish toward our system
- Replace any raw colors in `components/checks/*` with semantic tokens. Add `--ok/--warn/--bad` (+ `-bg` variants) to `src/styles.css` *once*; use Tailwind arbitrary classes off those.
- Header uses `PageHeader` (consistent with Define/Inbox), not a custom bar.
- Left-pane filter tabs reuse the same segmented-control pattern as Define's grouping toggle.
- "Set a standard" menu uses `DropdownMenu` (already in use elsewhere), not a custom popover.

### D. Command palette
- Add Checks-aware commands: "Jump to deviating checks", "Simulate metadata change", "Open check by question". One file edit, no new infra.

### E. Engine demo affordance
- The "Simulate metadata change" dev action lives in `PageHeader` actions on `/enforce/checks` (not a floating button). Triggers `engine.diffMetadata → affectedChecks → runChecks`, then bumps the inbox.

### F. Billing integration
- Each simulated run debits credits via the existing `billing-mock` (1 credit per re-evaluated check). Makes the §5 cost story real without new UI — the existing `CreditMeter` already shows it.

---

## What this plan deliberately does NOT do

- No `/enforce/connections` page. Connections live as a section in `/settings` (one block, mocked rows). Adding a route now is premature.
- No new `Run` history UI. Runs stay in-memory; the inbox is the user-visible artifact of a run.
- No rewrite of `CheckDetail` to match the mock pixel-for-pixel. We keep its structure, swap colors to tokens, and stop.
- No deletion of `BulkGenerateDialog`. It already fits "Draft from sources" — relabel only.
- No Suites page. Sidebar stub stays.
- No `experiment.tsx` / `serve.tsx` work — they don't exist in the current tree (already gone).

---

## Files touched (small, surgical)

**Edit**
- `src/lib/inbox-store.ts` — add `deviation` / `no-standard` kinds; derive-from-checks seeder.
- `src/routes/index.tsx` — render new kinds; open `CheckDetail` in `InboxSheet` for deviations.
- `src/routes/define.tsx` — definition card: lifecycle pill, fingerprint chips, "N checks" link.
- `src/routes/enforce.checks.tsx` — use `PageHeader`; add "Simulate change" action.
- `src/components/checks/*` — swap raw colors → tokens; align typography with rest of app.
- `src/components/CommandPalette.tsx` — add Checks commands.
- `src/components/BulkGenerateDialog.tsx` — relabel to "Draft from connected sources".
- `src/styles.css` — add `--ok/--warn/--bad` (+ `-bg`) semantic tokens.
- `src/routes/settings.tsx` — Connections block (static, mocked).
- `src/lib/mock-data.ts` — extend `Definition` with `state`, `fingerprint`, `version`, `expiresAt` (optional; default safe).

**No new files.** Everything we need exists.

---

## Open question (just one)

The previous plan asked four. Three are answered by what's on disk (Experiment/Serve gone, rebrand done, BulkGenerate kept). The remaining one:

**Inbox-as-single-queue, or keep both?** My recommendation above is **one queue**: deviations *are* inbox items, and `CheckDetail` renders inside `InboxSheet`. The `/enforce/checks` page stays as the Enforce-scoped deep view (filters, frequency ranking, batch actions later). Confirm and I build.
