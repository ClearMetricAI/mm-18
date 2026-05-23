# Plan: Strip /define down to a single review queue

## What's confusing today

The page stacks 6 layers: header, suggestion strip, toolbar (search + 2 filters + 2 toggles + group-by), sticky column header, grouped table, detail drawer, plus a floating bulk action bar. Every layer competes for the user's eye. For an MVP whose moat is "engine produces, user reviews," all of that scaffolding hides the one job.

## Core principle

The page becomes **one column, one scroll, one decision at a time.** Engine suggestions on top. Approved definitions below. Nothing else.

## What stays

- Page title with a single count: "12 to review · 47 approved"
- **Inbox** (engine suggestions): vertical stack of review cards — Accept / Edit / Dismiss. Always visible, no collapse.
- **Library** (approved definitions): plain vertical list below the inbox. Each row: name, one-line description, serve-to-AI toggle. Clicking opens an inline edit (no drawer).
- Search box (one, simple, top of library).

## What goes away

- Owner filter, Domain filter, Served/Draft toggles, Group by dropdown.
- Sticky column headers and grouped sections.
- Checkbox bulk-select column and the floating bulk action bar.
- Right-side detail drawer (replaced by inline expand).
- "Share" header button. "New" demoted to a small `+` next to the library heading.
- The collapsible chevron on the suggestion strip (always open, no chrome).

## What changes elsewhere (only what mirrors this pattern)

- **Experiment**: drop the about-strip toggle, drop the "Suggest more" button (suggestions auto-appear), drop "Group by" anywhere it lingers. One column: definition picker on the left, question list on the right, suggestions on top of the question list.
- **Serve**: collapse the four-section stack into two — ROI line + activity log. "Most/Never requested" stays but as a single combined list with the "See why" action; stats row goes from 5 tiles to 3 (Today / This week / p50).
- **Settings**: no change — already simple.

## Files touched

- edit `src/routes/define.tsx` — remove toolbar, drawer, bulk bar, grouping; render inbox + library list
- edit `src/routes/experiment.tsx` — remove about-toggle and "Suggest more" button; let strip render whenever suggestions exist
- edit `src/routes/serve.tsx` — drop 2 stat tiles, merge usage insights into one list

## Out of scope

- No new components (reuse `ReviewCard` / `ReviewStrip`).
- No data model changes.
- No nav changes.
- Filters/grouping aren't deleted from the codebase wholesale yet — just removed from the rendered UI. If the user later wants power-user tools back, they live behind a single "⋯" menu.

## Why this works

The user opens /define and sees: "Here are N things the engine wants you to look at. Below are the ones you've already approved." That's the entire mental model. Three buttons per item. No filters to learn, no grouping to configure, no drawer to navigate. The moat is visible because the engine's output is the first thing on screen, not buried under toolbars.
