## The pivot in one line

ClearMetric → **Referee**. Two modules (**Define** + **Enforce**) in one workspace, with a neutral conformance-checking engine. Experiment and Serve are cut; their conceptual weight moves into Enforce > Checks.

The mock you pasted is the target shape for the Enforce UI. Define keeps its current home but gains lifecycle (`draft → in_review → governed`) and a dependency fingerprint.

---

## Scope of this build (Slice 1)

The spec is a full V1 product. Trying to ship all of it in one pass produces a thin everything. This plan builds the **demonstrable shell + the one new surface that proves the pivot** (Checks two-pane), with mocked engine and one mocked connector. Everything else is explicitly deferred and listed at the bottom.

What ships in Slice 1:
1. Rebrand shell (name, sidebar nav, module-as-section IA)
2. Adapt **Define** for lifecycle + fingerprint (light)
3. New **Enforce > Checks** two-pane page (the mock)
4. Mocked engine (metadata diff → affected checks → re-eval)
5. Mocked Cortex/Copilot/Genie connectors (returned query + result per check)
6. Inbox repurposed as the cross-module triage queue (deviations, no-standard, drafts)

---

## Information architecture

```text
Workspace: Referee
─────────────────
Inbox            (cross-module triage)
Define           definitions (governed truth)
Enforce
  Checks         two-pane: queue + detail
  Connections    (under Settings in Slice 1)
─────────────────
Settings
```

- **One workspace, modules as nav sections** — no product switcher. If Enforce is disabled (future), its section collapses to an "Add Enforce" affordance.
- **Suites** node is reserved in the sidebar but disabled with a "Coming soon" hint. Don't build the page.
- Pricing/Trial chrome stays (it earns the "modules light up by billing" story).

---

## Data model (frontend mocks)

Add to `src/lib/mock-data.ts` (or split into `src/lib/referee/`):

```text
Definition (extend existing)
  + state: 'draft' | 'in_review' | 'governed'
  + expiresAt: ISO date | null
  + fingerprint: string[]   // metadata_object ids
  + version: number
  + source: 'manual' | 'catalog' | 'tool_adopted'

Check (new)
  id, questionText, definitionId | null,
  frequencyScore (asks/week), status: 'no_standard' | 'conforming' | 'deviating',
  toolResults: ToolResult[]

ToolResult (new)
  tool: 'cortex' | 'copilot' | 'genie',
  returnedQuery (SQL/DAX string), returnedResult (string),
  verdict: 'conforms' | 'deviates',
  deviationNote?: string

MetadataObject (new)
  id, type: 'table' | 'column' | 'measure',
  qualifiedName, contentHash, source

Run (new, in-memory only)
  id, trigger, startedAt, finishedAt, affectedCheckIds, costUnits
```

No real persistence — same pattern as the existing billing/inbox stores (`useSyncExternalStore` over a small in-memory + localStorage layer).

---

## Mocked engine (`src/lib/referee/engine.ts`)

One file, three pure functions:

- `diffMetadata(prev, next) → changedObjectIds`
- `affectedChecks(checks, changedObjectIds) → Check[]` (fingerprint intersection)
- `runChecks(checks) → ToolResult[]` (deterministic mock: flips a known subset to `deviates` with realistic SQL/DAX deltas)

A **"Simulate metadata change"** dev button in the header lets you demo cost-engine behavior: nothing changed → 0 calls; rename `orders.region` → N affected checks re-evaluated. This sells the §5 story without needing a real warehouse.

---

## Pages to build / change

### `src/routes/index.tsx` — Inbox (keep, adapt)
Same queue, new item types: `deviation`, `no-standard`, `staleness` (definition `expiresAt` passed). Reuse `InboxItem`/`InboxSheet`.

### `src/routes/define.tsx` — Define (keep, light edits)
- Group list by **state** (Governed / In review / Draft) instead of current grouping.
- Definition detail shows: query_text, owner, lifecycle dropdown, expires_at, **fingerprint chips** (e.g. `orders.region`, `customers.is_active`), version.
- Remove BulkGenerate dialog (or keep — it still fits "draft from catalog/tool history"). **Keep**, retitle to "Draft from connected sources".

### `src/routes/enforce/checks.tsx` — NEW (the two-pane)
Mirrors the HTML mock exactly:
- **Left pane (320px):** segmented tabs (Deviating · No standard · Conforming · All), search, grouped list, frequency-ranked.
- **Right pane:** question + cause note + Standard block ("from Define" tag) + per-tool result cards (`conforms` / `deviates` with returned query inline + diff highlight) + dependency fingerprint chips + Set-a-standard action with 4 options (govern in Define / adopt tool method / use catalog / author manually).
- Empty state when no check selected.

### `src/routes/experiment.tsx` — delete
### `src/routes/serve.tsx` — delete
(Or stub to redirect to `/enforce/checks` so old links don't 404 during preview.)

### `src/routes/settings.tsx` — add Connections section
Mocked rows for Cortex / Copilot / Genie / Catalog with status dots. No real OAuth.

### `src/components/AppSidebar.tsx`
- Rename brand to **Referee**.
- Reorder nav: Inbox · Define · Enforce (group label, with Checks under it) · Settings.
- Greyed "Suites — soon".
- Profile + trial chrome unchanged.

---

## Files added / changed / deleted

**Added**
- `src/lib/referee/engine.ts` — mock engine (diff/affected/run)
- `src/lib/referee/checks-store.ts` — useSyncExternalStore over checks + runs
- `src/lib/referee/mock-checks.ts` — seed data (questions, fingerprints, returned queries)
- `src/components/checks/CheckQueue.tsx` — left pane
- `src/components/checks/CheckDetail.tsx` — right pane
- `src/components/checks/ToolResultCard.tsx` — conforms/deviates card with query diff
- `src/components/checks/SetStandardMenu.tsx` — 4-path standard picker
- `src/routes/enforce/checks.tsx` — page composing the two panes

**Changed**
- `src/lib/mock-data.ts` — extend `Definition` with lifecycle + fingerprint
- `src/lib/inbox-store.ts` — add `deviation`, `no-standard`, `staleness` item kinds
- `src/routes/define.tsx` — state grouping + fingerprint UI in detail
- `src/routes/index.tsx` — render new inbox item types
- `src/components/AppSidebar.tsx` — rebrand + nav reorder
- `src/routes/settings.tsx` — Connections section
- Brand strings everywhere (search/replace `ClearMetric` → `Referee`)

**Deleted**
- `src/routes/experiment.tsx`
- `src/routes/serve.tsx`

---

## Visual system

Adopt the mock's tokens into `src/styles.css` as semantic additions (don't strip what's there — keep existing tokens for backward compat):
- `--ok / --okbg`, `--warn / --warnbg`, `--bad / --badbg` for verdict states.
- Mono font stack for SQL/DAX blocks.
- Result-card variants (`conforms`, `deviates`, `plain`) wired through `cva`.

---

## Explicitly deferred (named, not forgotten)

- Suites (sidebar item present but disabled)
- Periodic sweep / model-drift detection
- Real connectors (Cortex API, Copilot MCP, Genie) — all mocked
- Real SQL/DAX semantic parser — fingerprint is hand-authored in mock data
- Audit log UI (events captured in memory, no page)
- SSO/SAML, tenant isolation, RBAC
- Domain/team ownership rollups
- Suites comparison runs (baseline vs candidate)
- Cost ledger detail page (header shows running total only)

---

## Open questions before I start

1. **Confirm Experiment + Serve are cut.** They're not in the spec, but the current app has working pages. Delete or stub-redirect?
2. **Inbox vs Checks for triage.** Spec puts triage in Checks (two-pane queue). Current app has a separate Inbox. Proposal above keeps Inbox as a *cross-module* feed (Define drafts + Enforce deviations) and Checks queue as the *Enforce-only* deep queue. OK, or collapse to just Checks?
3. **BulkGenerate dialog** — keep (retitled "Draft from sources") or remove? It fits Define's "draft from catalog" flow.
4. **Rebrand fully now**, or run "Referee" as a label and keep "ClearMetric" code identifiers? Full rebrand is cleaner; takes ~5 extra minutes.

Answer those four and I'll build Slice 1.