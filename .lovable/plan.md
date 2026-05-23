## The core question

**What is Serve actually for?** Today it's a log viewer with 4 stat cards and a 6-column activity table. That's plumbing, not value.

The user's real questions on this page are:

1. **Is it working?** (alive, fast, being used)
2. **What should I define next?** ← *this is the killer one*
3. **What's getting used most?** (where does ClearMetric earn its keep)

Question #2 is the highest-value thing Serve can do. Every time an AI agent asks something that doesn't match a served definition, that's a gap — and a concrete suggestion for what the user should define next. No other page in the app surfaces this. **This is what Serve should lead with.**

The raw activity log is still useful for debugging, but it shouldn't be the headline.

---

## Plan

### 1. Redesign Serve around "coverage gaps"

New page structure, top to bottom:

```text
┌────────────────────────────────────────────────────────────┐
│ Pulse:  47 calls today · 4 agents · 94ms p50 · Live ●     │  ← one line, not 4 cards
├────────────────────────────────────────────────────────────┤
│ COVERAGE GAPS                                               │
│ Queries AI agents asked that weren't matched by any served │
│ definition. Define these to close the gap.                 │
│                                                             │
│ 8 unmatched queries this week                              │
│ ┌─────────────────────────────────────────────────┐        │
│ │ "what counts as a power user"         3 asks   →│        │
│ │ "qbr revenue formula"                 2 asks   →│        │
│ │ "trial conversion ratio"              2 asks   →│        │
│ │ "rule of 40"                          1 ask    →│        │
│ └─────────────────────────────────────────────────┘        │
│ → click row = "Create definition" prefilled               │
├────────────────────────────────────────────────────────────┤
│ MOST-ASKED DEFINITIONS (this week)                          │
│ Net Revenue        ████████████ 38                          │
│ Logo Churn         ███████ 22                               │
│ MRR                ████ 14                                  │
│ CAC                ██ 8                                     │
├────────────────────────────────────────────────────────────┤
│ ACTIVITY  ▾                                  All agents ▾  │
│ (collapsed by default, expand to see raw log)              │
└────────────────────────────────────────────────────────────┘
```

Why this works:
- The first thing you see is **what to do next**, not a passive log
- The pulse line replaces 4 cards — same info, 1/4 the space
- "Most-asked" justifies the product: *"Net Revenue was answered 38 times this week — that's 38 arguments avoided"*
- Activity log moves to a collapsible section for debugging only

I'll add `unmatchedQueries` and `topDefinitions` to the mock data so the page feels real.

### 2. Slim the tables — keep only what users scan for

**Serve activity** (when expanded): drop from 6 columns to **3**.

```text
Before:  Time · Agent · Tool · Input · Definition · Latency
After:   Time · "query"  →  Definition          [meta on hover]
```

Agent, tool, and latency become a tiny secondary line under the query, or appear on row hover. Most of the time you only care: *when, what was asked, what did we serve.*

**Define table**: drop from 6 columns to **3**.

```text
Before:  Definition+preview · Owner · Domain · Status · Confirmed · AI
After:   Definition  ·  Owner / Domain (one cell)  ·  AI toggle
         status dot before the name; confirmed date moves to drawer only
```

The description preview after the name goes — it's noise at scale (hundreds of rows). Group-by already covers "Owner" or "Domain" when you need them. The drawer has every detail when you click in.

### 3. Consistency pass

- **PageHeader**: Define has its own custom header, Serve/Connect use `PageHeader`. Standardize all four routes on the same slim 56px header pattern (single-line title + right-side actions).
- **Stat cards everywhere**: replace big 4-up stat-card grids on Serve and Connect with the same one-line "pulse" pattern. Cards waste vertical real estate on a dense product.
- **Quiet runtime fix** (silent): `relTime` in Serve uses `Date.now()` which causes a hydration mismatch. Switch to the same fixed `REF_TS` we use for `activityLog` timestamps.

### 4. Out of scope (calling it out so we don't drift)

- Not redesigning Connect significantly — it's correctly minimal already. Just the pulse-line tweak in section 3.
- Not adding analytics charts / time-series — keep V1 honest and simple.
- Keeping mock data; no real backend wiring.

---

## Technical notes

- New mock arrays in `src/lib/mock-data.ts`:
  - `unmatchedQueries: { query: string; count: number; lastAsked: string }[]`
  - `topDefinitions: { definitionId: string; count: number }[]` (derived)
- New `Pulse` component in Serve replacing the 4-card grid
- `relTime` accepts an optional `now` arg, defaults to `REF_TS` to stay SSR-safe
- Define table: change grid template from `1fr_140px_120px_90px_100px_70px` to `1fr_180px_70px`; move status into a dot left of the name; drop the inline description preview
- Serve activity: change grid template to `90px_1fr_200px`; hover-reveal a small `agent · tool · 94ms` footer line per row
