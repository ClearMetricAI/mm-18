# Smart Views in the sidebar

User-created, named, filter-based views over the Definitions library. Pinned in the sidebar. Persisted in `localStorage` (no backend needed for v1).

## What the user sees

Sidebar under **Define**:

```
Define
Experiment
Serve
─────────────
MY VIEWS
  ★ Board metrics
  ★ Finance · drift
  ★ Owned by me
  + New view
─────────────
Settings
```

- Click a view → routes to `/define?view=<id>`, opens the Library tab pre-filtered, view name shown as the section header with an "Edit / Rename / Delete" `⋯` menu.
- "+ New view" → opens a small filter-builder modal. Save asks for a name.
- Collapsing: the whole "My Views" group is collapsible (chevron next to the label) and remembers its open/closed state.
- Empty state: if no views exist, "MY VIEWS" group shows just "+ New view" inline.

## Filter model

A view is `{ id, name, rules: Rule[] }`. Rules combine with AND (keep it simple — no OR / nesting in v1).

Rule fields available (all from the existing `Definition` type, nothing new):
- **Name** contains `<text>`
- **Owner** is / is not `<owner>`
- **Source** is / is not `<source>` (Salesforce, Snowflake, dbt, Manual, …)
- **Domain** is / is not `<domain>` (Finance, Product, …)
- **Status** is `draft | approved | tested`
- **Served to AI** is `true | false`
- **Has drift** is `true | false`

Builder UI: a stacked list of rule rows (field dropdown + operator + value), `+ Add rule` button, `Save view` / `Cancel`. No fancy query language.

## Where it integrates in `/define`

- Library tab gains a small header strip when a view is active: `Board metrics · 12 of 60  [Edit] [×]` (× clears the view).
- The view's filter runs *in addition to* the search box, so users can still type-to-narrow within a view.
- The Inbox tab is unaffected — views only scope the Library.

## Files touched

- `src/lib/views.ts` (new) — `View` and `Rule` types, `matchesView(def, view)` evaluator, `loadViews()` / `saveViews()` localStorage helpers, default empty array.
- `src/lib/views-store.ts` (new) — tiny `useViews()` hook wrapping the localStorage helpers with `useSyncExternalStore` so the sidebar and `/define` stay in sync.
- `src/components/AppSidebar.tsx` — add the collapsible "MY VIEWS" group with the list of views, the `+ New view` button, and the per-view `⋯` menu (rename, edit, delete). Active highlighting reads `?view=` from the URL.
- `src/components/view-editor.tsx` (new) — modal dialog with the rule builder. Used for both "new view" and "edit view." ~150 lines, uses existing shadcn `Dialog`, `Select`, `Input`, `Button`.
- `src/routes/define.tsx` — read `?view=` from search params, apply `matchesView` on the Library list, render the active-view header strip with edit/clear actions.

## What's out of scope (v1)

- No OR logic, no nested groups, no saved-filter sharing across users.
- No views on Inbox, Experiment, or Serve — Definitions only.
- No backend persistence — `localStorage` per browser. Easy to swap to Lovable Cloud later by replacing `views-store.ts`.
- No drag-to-reorder; views are listed in creation order with newest at the bottom. Reorder can come later if asked for.

## Why this is small

Reuses every existing concept: shadcn dialog, the existing Definition fields, the existing Library tab. No new route, no schema change, no engine work. The whole feature is one new lib file + one new component + small additions to the sidebar and `/define`.
