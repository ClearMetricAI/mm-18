# Full Pricing Scenario — Simple & Intuitive

End-to-end pricing experience, mocked. No backend, no Stripe. Designed so a user understands what they pay for and what state they're in **without reading any explanation**.

## Three surfaces. That's it.

### 1. `/pricing` — the public page
Four cards in a row. Same minimal aesthetic as the rest of the app.

```
   Free          Starter         Team           Business
    $0           $49/mo         $299/mo         $999/mo

   500           10,000         75,000          300,000
  credits       credits         credits         credits

  1 source      3 sources      10 sources      Unlimited

   Start         Choose         Choose         Contact us
```

Below the row, one quiet line:
> *Credits cover engine work — drafts, drift checks, improvements. AI serving is always unlimited.*

No feature matrix. No comparison table. No FAQ. If a user can't decide from this, the answer is Starter.

### 2. Sidebar meter — always visible
Bottom of sidebar, above Settings. One line.

```
▓▓▓▓▓▓▓░░░  6.2k / 10k
```

Muted gray. Turns amber at 80%, red at 100%. Click → Billing.

That's the entire "you're being metered" signal. No tooltip needed, no labels — the bar speaks for itself.

### 3. Settings → Billing — the in-app surface
One screen, three short blocks, no tabs:

**Plan**
```
Team · $299/mo                              Change
```

**Usage this month**
```
▓▓▓▓▓▓▓░░░  6,247 / 10,000     resets Dec 14

  Drafts                  2,340
  Drift checks            1,820
  Improvements            1,290
  Syncs                     797
```

**Top up**
```
[ 5,000 — $25 ]   [ 20,000 — $90 ]   [ 100,000 — $400 ]
```

That's the whole billing page. No invoices, no payment methods, no activity log expander — they add noise without adding clarity at this stage.

## The threshold experience (this is the part most pricing UIs miss)

A subtle banner at the top of the app changes with usage:

- **<80% used** → no banner. Silence is the feature.
- **80–99% used** → thin amber strip: *"You've used 85% of your credits."* with a single `Top up` button. Dismissible.
- **100% used** → red strip, not dismissible: *"Credits exhausted. Engine paused."* Inbox shows a quiet empty state: *"Engine paused. Top up to resume."* Definitions keep serving to AI (because serving is free and unlimited — important nuance the UI surfaces by *not* breaking).

To let you experience all three without waiting, add a tiny scenario toggle on the Billing page, bottom-right, faded:
```
Scenario: ○ Healthy  ○ Warning  ● Limit hit
```
Reload-safe via localStorage. Removed before real launch.

## Plan change = one tap

`Change` opens a small sheet showing the four tiers as a vertical list. Tap one → toast: *"Moved to Team."* Done. No confirmation modal, no "are you sure," no proration math shown.

## Why this is simple

- No tabs anywhere
- One number per concept (credits used, credits in pack, dollars per plan)
- The progress bar is the only chart
- Color carries meaning (gray / amber / red) so the user doesn't read words to know their status
- Every action is one click

## Files

- `src/lib/billing-mock.ts` — plans, usage state, scenario switch, hook
- `src/components/CreditMeter.tsx` — sidebar pill
- `src/components/UsageBanner.tsx` — threshold strip (renders nothing when healthy)
- `src/routes/pricing.tsx` — public page
- `src/routes/settings.billing.tsx` — billing surface (or inline section if settings is single-page)
- `src/components/AppSidebar.tsx` — mount `<CreditMeter />`
- `src/routes/__root.tsx` — mount `<UsageBanner />` once

Approve and I'll build it. You'll be able to click `/pricing`, watch the meter in the sidebar, flip the scenario toggle to see warning + limit-hit states, and top up — the full story.
