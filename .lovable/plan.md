# AI assist for ClearMetric — minimal cut

Add a single `✨ Draft with AI` pattern that works for both auto-generated and manual definitions, plus a drift signal and AI-generated test questions. No new pages, no chat panel, no review queue.

## Scope

Four UI touchpoints. One data-model addition. No backend wiring yet (mock the AI call so the UX is real and reviewable; swap to Lovable AI later in one place).

### 1. Define — origin badge in drawer header
Tiny inline badge next to the definition name showing provenance:
- `⚡ Auto · {source}` — engine-generated
- `✏️ Manual` — user-created
- `⚠️ Drifted` — replaces the auto badge when `driftFlag` is true (amber)

Purely informational. No filtering, no separate tab.

### 2. Define — ✨ Draft with AI on Description and Formula
Small `✨` icon-button in the top-right of each field's label row. Click:
- Shows a 600ms shimmer over the field
- Replaces field content with mock AI draft built from name + domain + sibling fields
- User edits inline as normal, saves on blur

Same button works for empty fields (manual creation) and populated fields (regenerate).

### 3. Define — drift strip in drawer
When `selected.driftFlag === true`, render a thin amber strip directly under the drawer header:

```text
⚠ Source changed Mar 12 · `revenue.amount` → `revenue.net_amount`   [✨ Update formula]
```

The inline `✨ Update formula` button calls the same draft action scoped to the formula field, then clears `driftFlag` on save.

### 4. Experiment — ✨ Generate test questions
New button next to "Run all" in the Experiment header: `✨ Generate questions`. Click:
- Mock-appends 3 new `TestQuestion` entries for the selected definition (realistic question + 2–3 criteria, empty baseline/CM responses)
- Toast: "3 questions drafted — review and run"
- Real model runs still produce baseline/CM responses (we never fabricate those)

## Data model changes (`src/lib/mock-data.ts`)

Add to `Definition`:
```ts
origin: "auto" | "manual"
driftFlag?: boolean
driftNote?: string   // e.g. "`revenue.amount` → `revenue.net_amount`"
driftDate?: string
```

Seed:
- ~70% of existing definitions → `origin: "auto"`, remainder `"manual"`
- 2–3 definitions get `driftFlag: true` with realistic drift notes (so the amber strip is visible without hunting)

## File changes

- `src/lib/mock-data.ts` — extend `Definition` type, seed origin + drift on a few rows, add a `draftField(def, field)` helper that returns plausible mock text
- `src/routes/define.tsx` — origin badge in drawer header, drift strip, ✨ buttons on Description and Formula labels, shimmer state during "draft"
- `src/routes/experiment.tsx` — `✨ Generate questions` button in header, append-questions handler, toast

No changes to Serve, Settings, sidebar, or routing.

## Technical notes

- The mock `draftField` lives in `mock-data.ts` and returns deterministic strings per (definitionId, field) so the demo is stable. When real AI lands, swap this for a `POST /api/ai/draft` server function — the call site in the component stays identical.
- Shimmer = a `bg-gradient-to-r animate-pulse` overlay on the field for ~600ms, then state update. Keep it subtle.
- Drift strip uses existing token `--warning` (or `--destructive` at 60% if no warning token exists — confirm in `styles.css` during build).
- ✨ icon = `Sparkles` from lucide (already imported in Define).
- Origin badge uses the existing `Badge` component with `variant="outline"` and a tiny lucide icon (`Zap`, `Pencil`, `AlertTriangle`).

## Explicitly out of scope

- Real Lovable AI wiring (one swap later; mock now keeps the loop fast)
- Review queue / pending state / approval workflow
- AI-generated baseline or CM responses in Experiment
- Chat panel, command-palette AI actions
- Backend sync endpoint, drift detection logic (assumed already exists)
- Bulk AI actions on multiple definitions
