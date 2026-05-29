import type { Check, MetadataObject } from "./types";

// Metadata catalog (the "fingerprint" targets). Hand-authored, deterministic.
export const METADATA: MetadataObject[] = [
  { id: "md.orders.region", qualifiedName: "orders.region", type: "column", source: "Snowflake / sales", contentHash: "h1" },
  { id: "md.orders.amount", qualifiedName: "orders.amount", type: "column", source: "Snowflake / sales", contentHash: "h1" },
  { id: "md.orders.status", qualifiedName: "orders.status", type: "column", source: "Snowflake / sales", contentHash: "h1" },
  { id: "md.subs.mrr", qualifiedName: "subscriptions.mrr_normalized", type: "column", source: "Snowflake / sales", contentHash: "h1" },
  { id: "md.events.is_internal", qualifiedName: "events.is_internal", type: "column", source: "Snowflake / events", contentHash: "h1" },
  { id: "md.events.user_id", qualifiedName: "events.user_id", type: "column", source: "Snowflake / events", contentHash: "h1" },
  { id: "md.accounts.active", qualifiedName: "accounts.has_active_subscription", type: "column", source: "Snowflake / sales", contentHash: "h1" },
  { id: "md.opp.stage", qualifiedName: "opportunities.stage", type: "column", source: "Salesforce", contentHash: "h1" },
  { id: "md.opp.acv", qualifiedName: "opportunities.acv", type: "column", source: "Salesforce", contentHash: "h1" },
  { id: "md.measures.netrev", qualifiedName: "[Net Revenue]", type: "measure", source: "Power BI / finance", contentHash: "h1" },
  { id: "md.measures.arr", qualifiedName: "[Annual Recurring Revenue]", type: "measure", source: "Power BI / finance", contentHash: "h1" },
];

// Seed checks. Each is one business question being watched against a standard.
export const SEED_CHECKS: Check[] = [
  {
    id: "chk_active_customers_by_region",
    questionText: "Active customers in EMEA last quarter",
    definitionId: "def_active_customer",
    frequencyScore: 47,
    status: "deviating",
    causeNote: "`orders.region` was renamed from `region_code` last week — Cortex is still using the old name.",
    fingerprint: ["md.accounts.active", "md.orders.region"],
    toolResults: [
      {
        tool: "cortex",
        returnedQuery:
          "SELECT COUNT(DISTINCT account_id)\nFROM accounts a\nJOIN orders o ON o.account_id = a.id\nWHERE a.has_active_subscription = true\n  AND o.region_code = 'EMEA'\n  AND o.order_date >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months')",
        returnedResult: "1,284",
        verdict: "deviates",
        deviationNote: "Filters on `orders.region_code` — that column no longer exists.",
      },
      {
        tool: "copilot",
        returnedQuery:
          "EVALUATE\nCALCULATE(\n  DISTINCTCOUNT(Accounts[id]),\n  Accounts[has_active_subscription] = TRUE,\n  Orders[region] = \"EMEA\",\n  DATESINPERIOD(Orders[order_date], TODAY(), -1, QUARTER)\n)",
        returnedResult: "1,302",
        verdict: "conforms",
      },
      {
        tool: "genie",
        returnedQuery:
          "SELECT COUNT(DISTINCT account_id)\nFROM accounts a\nJOIN orders o ON o.account_id = a.id\nWHERE a.has_active_subscription = TRUE\n  AND o.region = 'EMEA'\n  AND o.order_date >= add_months(date_trunc('quarter', current_date), -1)",
        returnedResult: "1,302",
        verdict: "conforms",
      },
    ],
  },
  {
    id: "chk_net_revenue_q4",
    questionText: "What was net revenue in Q4?",
    definitionId: "def_net_revenue",
    frequencyScore: 89,
    status: "deviating",
    causeNote: "Copilot includes professional services. The governed standard excludes them.",
    fingerprint: ["md.measures.netrev"],
    toolResults: [
      {
        tool: "cortex",
        returnedQuery:
          "SELECT SUM(amount) - COALESCE(SUM(refunds), 0)\nFROM invoice_lines\nWHERE type = 'subscription'\n  AND status = 'paid'\n  AND invoice_date BETWEEN '2025-10-01' AND '2025-12-31'",
        returnedResult: "$12.4M",
        verdict: "conforms",
      },
      {
        tool: "copilot",
        returnedQuery:
          "EVALUATE\nCALCULATE(\n  SUM(InvoiceLines[amount]),\n  DATESBETWEEN(Calendar[Date], DATE(2025,10,1), DATE(2025,12,31))\n)",
        returnedResult: "$13.1M",
        verdict: "deviates",
        deviationNote: "No filter on `type = 'subscription'` — includes professional services and one-time fees.",
      },
      {
        tool: "genie",
        returnedQuery:
          "SELECT SUM(amount) - SUM(COALESCE(refunds, 0))\nFROM invoice_lines\nWHERE type = 'subscription' AND status = 'paid'\n  AND invoice_date BETWEEN '2025-10-01' AND '2025-12-31'",
        returnedResult: "$12.4M",
        verdict: "conforms",
      },
    ],
  },
  {
    id: "chk_mau_last_30",
    questionText: "MAU over the last 30 days",
    definitionId: "def_mau",
    frequencyScore: 62,
    status: "deviating",
    causeNote: "`events.is_internal` was renamed to `is_employee`. Genie hasn't picked up the change.",
    fingerprint: ["md.events.user_id", "md.events.is_internal"],
    toolResults: [
      {
        tool: "cortex",
        returnedQuery:
          "SELECT COUNT(DISTINCT user_id)\nFROM events\nWHERE event_ts >= CURRENT_DATE - INTERVAL '30 days'\n  AND is_employee = false",
        returnedResult: "48,219",
        verdict: "conforms",
      },
      {
        tool: "genie",
        returnedQuery:
          "SELECT COUNT(DISTINCT user_id)\nFROM events\nWHERE event_ts >= current_date - INTERVAL 30 DAYS\n  AND is_internal = false",
        returnedResult: "51,003",
        verdict: "deviates",
        deviationNote: "Uses `is_internal` — column was renamed to `is_employee` 4 days ago. Including employees inflates the count.",
      },
    ],
  },
  {
    id: "chk_arr_today",
    questionText: "What is our ARR today?",
    definitionId: "def_arr",
    frequencyScore: 134,
    status: "conforming",
    fingerprint: ["md.measures.arr", "md.subs.mrr"],
    toolResults: [
      {
        tool: "cortex",
        returnedQuery:
          "SELECT SUM(mrr_normalized) * 12\nFROM subscriptions\nWHERE status = 'active'",
        returnedResult: "$148.8M",
        verdict: "conforms",
      },
      {
        tool: "copilot",
        returnedQuery: "EVALUATE { [Annual Recurring Revenue] }",
        returnedResult: "$148.8M",
        verdict: "conforms",
      },
      {
        tool: "genie",
        returnedQuery:
          "SELECT SUM(mrr_normalized) * 12 FROM subscriptions WHERE status = 'active'",
        returnedResult: "$148.8M",
        verdict: "conforms",
      },
    ],
  },
  {
    id: "chk_qualified_pipeline",
    questionText: "What's our qualified pipeline this quarter?",
    definitionId: "def_pipeline",
    frequencyScore: 38,
    status: "conforming",
    fingerprint: ["md.opp.stage", "md.opp.acv"],
    toolResults: [
      {
        tool: "cortex",
        returnedQuery:
          "SELECT SUM(acv)\nFROM opportunities\nWHERE stage >= 2\n  AND status = 'open'\n  AND DATEDIFF('day', created_at, CURRENT_DATE) < 180",
        returnedResult: "$24.6M",
        verdict: "conforms",
      },
      {
        tool: "copilot",
        returnedQuery:
          "EVALUATE\nCALCULATE(\n  SUM(Opportunities[acv]),\n  Opportunities[stage] >= 2,\n  Opportunities[status] = \"open\",\n  Opportunities[age_days] < 180\n)",
        returnedResult: "$24.6M",
        verdict: "conforms",
      },
    ],
  },
  {
    id: "chk_logo_churn_qtd",
    questionText: "Logo churn QTD",
    definitionId: "def_logo_churn",
    frequencyScore: 21,
    status: "conforming",
    fingerprint: ["md.accounts.active"],
    toolResults: [
      {
        tool: "cortex",
        returnedQuery:
          "SELECT COUNT(*) FILTER (WHERE churned_at IS NOT NULL) * 1.0\n  / NULLIF(COUNT(*) FILTER (WHERE active_at_period_start), 0)\nFROM accounts\nWHERE period = DATE_TRUNC('quarter', CURRENT_DATE)",
        returnedResult: "3.2%",
        verdict: "conforms",
      },
    ],
  },
  // No-standard checks: questions the tools are answering but Define hasn't approved a standard for.
  {
    id: "chk_engaged_accounts",
    questionText: "How many engaged accounts do we have right now?",
    definitionId: null,
    frequencyScore: 19,
    status: "no_standard",
    fingerprint: [],
    toolResults: [],
  },
  {
    id: "chk_trial_to_paid",
    questionText: "What's our trial-to-paid conversion rate?",
    definitionId: null,
    frequencyScore: 14,
    status: "no_standard",
    fingerprint: [],
    toolResults: [],
  },
  {
    id: "chk_pipeline_velocity",
    questionText: "Pipeline velocity for enterprise segment",
    definitionId: null,
    frequencyScore: 8,
    status: "no_standard",
    fingerprint: [],
    toolResults: [],
  },
];
