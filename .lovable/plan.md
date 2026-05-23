# Make the value prop self-explanatory

Two minimal changes on `/experiment`. No new pages, no new data, no backend.

## 1. Rename + clarify the two columns

Industry pattern (LangSmith, Braintrust, Humanloop all do this): label the comparison by *what the model has access to*, not the product name.

- **"Without ClearMetric"** → **"Ungrounded"** with subtitle *"LLM answers alone"*
- **"With ClearMetric"** → **"Grounded"** with subtitle *"LLM + your definitions"*

Add an `(i)` tooltip on each header with one sentence:
- Ungrounded: *"The model answers from training data only. No company context."*
- Grounded: *"The model answers using your approved ClearMetric definitions as context."*

Applies in 3 places in `experiment.tsx`:
- Scorecards (line ~273)
- Per-question response panels (line ~489, ~497)
- "Ask any question" preview card (line ~691, ~697)

## 2. Replace the 3 scorecards with one ROI headline

Current: three equal cards (`Without` / `With` / `Improvement`). Reads as a chart, not a verdict.

Replacement: **one bold sentence + thin supporting row.**

```text
┌────────────────────────────────────────────────────────────┐
│  Grounding changed the answer on 7 of 10 questions  (70%)  │
│  ───────────────────────────────────────────────────────── │
│  Ungrounded 4/10 passed   →   Grounded 9/10 passed   +50%  │
└────────────────────────────────────────────────────────────┘
```

- **Headline** (text-lg, semibold): `Grounding changed the answer on X of Y questions`. Computed by counting questions where `baselineResponse !== cmResponse` (or grade differs). This is the killer stat — it answers *"do I need this?"* in one read.
- **Supporting row** (text-xs, muted): the three current numbers inline, separated by `→`. Same info, 1/3 the vertical space.
- Keep the existing thin pass/fail bar underneath unchanged.

Net effect: the page opens with a clear verdict instead of three numbers the user has to interpret.

## Out of scope

- No new metrics (hallucination detection, consistency runs, time-saved).
- No changes to the per-question table, judge logic, or data model.
- Product name "ClearMetric" stays everywhere else (sidebar, drift strip, etc.) — only the column labels change to functional terms.

## Files

- `src/routes/experiment.tsx` — only file touched.
