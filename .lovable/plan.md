# Plan: Frontend as a Review Queue

## Core principle

The engine is the moat. The frontend is dumb: it shows engine-produced items and gives the user three buttons — **Accept · Edit · Dismiss**. Same pattern for every content type. No "create from scratch" flows as primary actions; manual create stays available but secondary.

## What changes

### 1. New `<ReviewCard />` primitive (`src/components/review-card.tsx`)

Single component used everywhere. Props:
- `kind`: `"definition" | "test-question" | "drift" | "improvement" | "alias" | "criteria"`
- `title`, `body` (the suggestion content, kind-specific renderer)
- `rationale` (one-line "why the engine suggested this")
- `onAccept`, `onEdit`, `onDismiss`

Visual: subtle card, small `Sparkles` icon + kind label, body, rationale in muted text, three buttons right-aligned. That's it. No crowding.

### 2. Add a "Review" inbox surfaced inline on each page

Not a new nav item. Each page gets a collapsible **"N suggestions from the engine"** strip at the top that expands into a stack of `<ReviewCard />`s. When empty, the strip hides.

- **Define page**: drafted definitions (from connected sources/uploads), improvement suggestions, alias suggestions, drift alerts.
- **Experiment page**: suggested test questions for the selected definition, criteria refinement suggestions after runs.
- **Serve page**: alias suggestions for "Never Requested" definitions, drift alerts surfaced from sync.

One pattern, applied three places. No separate "Review Queue" route — it lives where the work lives.

### 3. Mock engine in `src/lib/engine.ts`

Single module that fakes everything the backend will eventually do. Pure functions returning typed suggestions:
- `draftDefinitionsFromSource(sourceId)` → `Definition[]` (draft status)
- `suggestTestQuestions(def)` → `{ question, criterion }[]`
- `detectDrift(defs)` → `DriftAlert[]`
- `suggestImprovements(def, failedCriteria)` → `Improvement[]`
- `suggestAliases(def)` → `string[]`
- `refineCriteria(runHistory)` → `CriteriaEdit[]`

All return seeded mock data today; swap for real RPCs later. Keeps frontend ignorant of how suggestions are produced.

### 4. Page-level simplifications

- **Define**: demote "+ New definition" button to a secondary action in a dropdown next to the primary "Review N suggestions" affordance. Drift flag on a row becomes a `<ReviewCard />` in the strip, not inline noise.
- **Experiment**: remove "draft test questions" button. Selecting a definition auto-populates the suggestion strip with engine-generated test questions; user accepts the ones they want into the run set.
- **Serve**: "Never Requested" pills get a one-click "See why" that opens the alias suggestion as a review card.
- **Settings**: file upload toast changes from "Found N definitions" to "Drafted N definitions — review on Define." Drafts land in Define's review strip.

### 5. What we don't do

- No new nav item.
- No separate routes.
- No backend wiring — `engine.ts` stays mock.
- No changes to `mock-data.ts` shape beyond adding light suggestion seeds.
- No redesign of existing tables/lists — only add the strip above them.

## Files touched

- create `src/components/review-card.tsx`
- create `src/lib/engine.ts` (mock suggestion producer + types)
- edit `src/routes/define.tsx` — add suggestion strip, demote manual create
- edit `src/routes/experiment.tsx` — replace draft-tests button with auto-populated suggestion strip
- edit `src/routes/serve.tsx` — wire "Never Requested" pills to alias review cards
- edit `src/routes/settings.tsx` — update upload toast copy

## Out of scope

Real engine, real drift detection, real grading, real alias inference. All deferred to backend. Frontend ships the review pattern with mocks so the shape is locked in before backend lands.
