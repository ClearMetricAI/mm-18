# ClearMetric V1 — tailored update plan

Kill the Baselines library. Experiment has one fixed baseline ("model + schema metadata"). Focus the MVP on the three things that drive value: file-upload onboarding, an ROI-shaped Serve page, and a credible Experiment comparison.

---

## 1. Remove the Baselines surface area

- Delete `src/routes/baselines.tsx`.
- Delete `src/lib/baselines-store.ts`.
- Remove the Baselines item from `src/components/AppSidebar.tsx`.
- In `src/routes/experiment.tsx`: remove the baselines dropdown, the multi-baseline tab strip, all `useBaselines` / `baselinesApi` usage, and `viewBaselineId` state.
- Let TanStack regenerate `routeTree.gen.ts` automatically.

Nav becomes: **Define · Experiment · Serve** (primary) + **Settings** (utility).

---

## 2. Experiment — realistic, single baseline

The baseline is conceptually fixed: *the LLM with model metadata (table names, columns, measures, source descriptions) but no governed definitions.* No picker.

**UI** (`src/routes/experiment.tsx`)
- Column labels: **Baseline** with small sub-label *"metadata only"* and **ClearMetric** with *"metadata + definitions"*. No banner, no disclaimer.
- Update the Judge chip tooltip to mention the metadata framing.
- Keep judge per-criterion reasons (already in the data model) rendering under each criterion in the expanded row — verify this still works after the dropdown removal.

**Mock data** (`src/lib/mock-data.ts`)
- Rewrite `baselineResponse` strings on seeded `testQuestions` so they read like an AI that can see the schema but doesn't know business rules. Mix the three failure modes:
  - **Hedging** — "Revenue can be calculated several ways depending on the report…"
  - **Schema inference** — "Based on the `invoices` table, revenue appears to include all billing line items…"
  - **Generic textbook** — "Churn typically includes both cancellations and downgrades…"
- Rewrite each `baselineReasons[]` to one-line judge-style reasons explaining *why* it failed: e.g. "References invoices but does not specify net ARR", "Hedges rather than giving a definitive answer", "Uses generic industry definition rather than company-specific".
- Update `draftTestQuestions()` placeholders and criteria slightly to reward specificity (e.g. "uses company-specific definition, not industry generic").

---

## 3. Serve — ROI dashboard

Rework `src/routes/serve.tsx` into four sections, top to bottom:

1. **ROI summary line** — auto-generated, factual, copy-pasteable:
   *"{X} questions answered with governed definitions this week across {Y} AI agents and {Z} users."* Small copy icon at the end.
2. **Stats row** — Today · This Week · Users · Agents · p50 Latency. (Adds Users + Agents to what exists.)
3. **Usage insights** — two columns:
   - **Most Requested** — definitions ranked by call count with a thin inline bar.
   - **Never Requested** — definitions where `serveToAi === true` but absent from `activityLog`. Muted "Unused" pill. Hint underneath: *"Consider renaming or checking if agents can find these definitions."*
4. **Activity log** — current table + a new **User** column (data already present). Keep filters and expandable response JSON.

**Move out of Serve, into Settings:**
- The MCP **Endpoint + API key** rows and the **Connect your agent** snippet tabs (Claude / Cursor / OpenAI / LangChain). Extract them to `src/components/mcp-connect.tsx` first, then delete from Serve and mount in Settings.

**Mock data tweaks** — add a few activity rows and make sure 2–3 `serveToAi: true` definitions have zero calls so "Never Requested" isn't empty.

---

## 4. Settings — file upload as a data source

In `src/routes/settings.tsx`:

- Add an **"Upload file"** button next to "Add source" in Data sources. Accepts CSV / XLSX / PDF / DOCX / MD / YAML.
- On file pick (mock — no real parsing in V1):
  - Append a new source card: type badge **"Upload"**, detail *"{N} definitions extracted"*, today's date, **no Sync button**.
  - Toast: *"Found N definitions in {filename}. Review them on Define."*
- Seed one example upload in `mock-data.ts` so the pattern is visible on first load.
- Extend the `DataSource` mock type with `type: "powerbi" | "snowflake" | "salesforce" | "manual" | "upload"` if needed.

**New "MCP endpoint" section on Settings** — endpoint URL row, API key row, connect-snippet tabs (the components extracted from Serve). MCP config lives here (input); MCP usage lives on Serve (output).

---

## 5. Routing polish

- `src/routes/index.tsx`: redirect `/` → `/define` via `beforeLoad: () => redirect({ to: '/define' })`. No welcome screen.

---

## Build order

1. **Remove Baselines** (§1) — unblocks the rest of Experiment.
2. **Experiment baseline reframe** (§2) — labels + rewritten mock responses/reasons.
3. **Serve ROI dashboard** + move MCP connect to Settings (§3 + part of §4).
4. **Settings file upload** (§4).
5. **Index redirect** (§5).

## Technical notes

- Pure frontend / mock-data work. No backend, no new packages, no schema changes.
- All MCP "connect" components get extracted to `src/components/mcp-connect.tsx` before being deleted from Serve, so the snippets aren't lost.
- Keep semantic tokens (`text-muted-foreground`, `bg-[var(--success)]`, etc.) — no raw colors.

Out of scope for this pass: real file parsing / LLM extraction, real MCP traffic, real judge calls, the Power BI connector — all remain mocked or deferred.
