## Read against the strategy

The strategy doc is unambiguous about what matters:

- **Define** is the timeless value (the dictionary).
- **Experiment** is the wedge — *"the Experiment page IS the demo. The product sells itself."*
- **Serve** is the production loop — definitions go to AI via MCP, every call logged for audit.
- Everything else is plumbing.

The current app is close but the narrative is muddled in three specific places:

### 1. Sidebar order doesn't tell the story

Today: `Connect · Define · Experiment · Serve`. Connect is plumbing but it's listed first, before the actual product. The story the strategy tells is `Define → prove with Experiment → Serve to AI`. Connect should be a low-priority settings entry, not the front door.

**Fix:** reorder to `Define · Experiment · Serve · Settings` (rename Connect → Settings, demote to bottom of the nav near the theme toggle).

### 2. Connect is a grab bag of three unrelated things

It currently holds:
- **Data sources** (Power BI, SQL) — these feed Define.
- **LLM keys** (answering model, judge model) — these power Experiment.
- **MCP endpoint URL + key + live call count** — this is the Serve runtime, duplicated.

That last item is the most damaging: the MCP endpoint card on Connect says "Active · 312 calls this week" which is exactly what the Serve pulse line shows. Two sources of truth for the same fact.

**Fix:**
- Move the **MCP endpoint URL + API key** to the top of the Serve page as a single thin "Endpoint" strip above the Pulse line. Serve is the right home: it's the page that proves the endpoint is doing something.
- Keep **data sources** and **LLM keys** in a renamed **Settings** page (was Connect). No live activity counters there — just connection state.

This collapses Connect from three sections to two, removes the duplicate runtime view, and puts the copyable endpoint next to the audit log that proves it works.

### 3. The first impression is the dictionary, not the demo

`/` redirects to `/define`. Right for daily users; wrong for first-time visitors and demo prospects who should land on the Experiment scorecard (the explicit "product sells itself" page).

**Fix:** I'll ask about this — see Question below — because changing it affects daily-user muscle memory.

### What I am NOT changing

- **Define** page: already at the right minimal shape (3-column table, slim header, drawer). Leave alone.
- **Experiment** page: heavy by necessity — this is the pitch. It earns its weight. Leave alone.
- **Serve** page: the recent rework (per-user/per-agent grouping, expandable rows with full response) is the right audit shape per strategy. Leave the body alone; just add the endpoint strip at the top.
- **Mock data**: no changes needed.

---

## Plan

### Step 1 — Reorder + rename sidebar

`src/components/AppSidebar.tsx`: change `nav` order to Define, Experiment, Serve. Move "Settings" (the renamed Connect, icon `Settings`) to the bottom group next to the theme toggle so it visually reads as a utility, not a top-level workflow step.

### Step 2 — Move MCP endpoint to Serve

In `src/routes/serve.tsx`, add a thin strip directly under `PageHeader`:

```text
Endpoint  https://mcp.clearmetric.ai/org_contoso/v1   [copy]
API key   cm_live_••••2f8a                            [copy]
```

Two rows, no card, no extra section header. The existing Pulse line ("Live · 47 calls · 4 users · 4 agents · 94ms p50") sits below — same data the Connect MCP card was showing, but now it's the only place that owns it.

### Step 3 — Slim Connect → Settings

Rename route file from `src/routes/connect.tsx` to `src/routes/settings.tsx` (and delete the old). Page now has just two sections:

1. **Data sources** (existing list, unchanged)
2. **LLM keys** (existing list, unchanged)

Remove the **MCP endpoint** section entirely — it moved to Serve.

Update `PageHeader` title from "Connect" to "Settings" and the meta to "Data sources · LLM keys".

Update the sidebar Link `to` from `/connect` to `/settings`. Any other in-app links to `/connect` (none currently, but check) get redirected.

### Step 4 — Decide on the index redirect

This depends on the question below. Either keep `/` → `/define` (current) or change to `/` → `/experiment` for demo-first first impressions.

---

## One question before I implement

Should `/` redirect to **Define** (today — best for daily users) or **Experiment** (the strategy's named demo — best for first-time visitors and prospects)? Either is defensible; I'd lean **Experiment** based on the strategy doc ("the Experiment page IS the demo"), but you may have strong feelings since this changes where the app opens every time.

---

## Technical notes

- Renaming `connect.tsx` → `settings.tsx` will cause `routeTree.gen.ts` to regenerate on next dev/build — no manual edit needed there.
- The MCP endpoint constants currently live inline in `connect.tsx`. They'll move with the endpoint UI into `serve.tsx`. No mock-data file changes.
- Total surface area: ~3 files edited (`AppSidebar.tsx`, `serve.tsx`, new `settings.tsx`), 1 deleted (`connect.tsx`). No new dependencies, no new components, no schema changes.