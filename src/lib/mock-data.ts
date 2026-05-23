export type DefStatus = "draft" | "tested";

export interface Definition {
  id: string;
  name: string;
  description: string;
  formula: string;
  owner: string;
  source: string;
  domain: string; // Finance, Product, Sales, CS, Growth, Marketing
  usedIn: string[];
  confirmedAt: string | null;
  status: DefStatus;
  serveToAi: boolean;
}

// Base hand-written definitions (the curated, high-quality ones).
const base: Definition[] = [
  {
    id: "def_net_revenue",
    name: "Net Revenue",
    description:
      "Subscription revenue recognized in the period, excluding professional services, one-time fees, and refunds. Reported on a net ARR basis.",
    formula: "SUM(invoice_lines.amount) WHERE type = 'subscription' AND status = 'paid' - refunds",
    owner: "Sarah Chen",
    source: "Power BI / Finance",
    domain: "Finance",
    usedIn: ["Finance Weekly", "Board Deck Q4", "ARR Dashboard"],
    confirmedAt: "2025-05-10",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_mrr",
    name: "MRR",
    description:
      "Monthly Recurring Revenue. Sum of all active subscription contract values, normalized to a monthly cadence. Excludes professional services.",
    formula: "SUM(subscriptions.mrr) WHERE status = 'active'",
    owner: "Sarah Chen",
    source: "Power BI / Finance",
    domain: "Finance",
    usedIn: ["Finance Weekly", "Investor Update"],
    confirmedAt: "2025-04-22",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_arr",
    name: "ARR",
    description: "Annual Recurring Revenue. MRR × 12 across active subscriptions on the snapshot date.",
    formula: "MRR * 12",
    owner: "Sarah Chen",
    source: "Power BI / Finance",
    domain: "Finance",
    usedIn: ["Board Deck Q4", "Investor Update"],
    confirmedAt: "2025-05-12",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_gross_margin",
    name: "Gross Margin",
    description:
      "Revenue minus cost of revenue (hosting, support, third-party API costs), divided by revenue. Reported as a percentage.",
    formula: "(revenue - cogs) / revenue",
    owner: "Sarah Chen",
    source: "Manual",
    domain: "Finance",
    usedIn: ["Finance Weekly", "Board Deck Q4"],
    confirmedAt: "2025-04-12",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_logo_churn",
    name: "Logo Churn",
    description:
      "Percentage of customers (accounts) that cancelled in the period, divided by customers at the start of the period. Not weighted by revenue.",
    formula: "COUNT(churned_accounts) / COUNT(active_accounts_start_of_period)",
    owner: "Marcus Liu",
    source: "Power BI / CS",
    domain: "Customer Success",
    usedIn: ["Retention Dashboard", "QBR Template"],
    confirmedAt: "2025-05-01",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_revenue_churn",
    name: "Revenue Churn",
    description:
      "Lost MRR from cancellations and downgrades in the period, divided by MRR at the start of the period. Excludes new business and expansion.",
    formula: "(churned_mrr + downgrade_mrr) / starting_mrr",
    owner: "Marcus Liu",
    source: "Power BI / CS",
    domain: "Customer Success",
    usedIn: ["Retention Dashboard"],
    confirmedAt: "2025-04-18",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_nrr",
    name: "Net Revenue Retention",
    description:
      "Starting MRR plus expansion, minus churn and downgrades, divided by starting MRR. Cohort-based on customers active at period start.",
    formula: "(starting_mrr + expansion - churn - downgrade) / starting_mrr",
    owner: "Marcus Liu",
    source: "Power BI / CS",
    domain: "Customer Success",
    usedIn: ["Board Deck Q4", "Retention Dashboard"],
    confirmedAt: "2025-05-03",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_mau",
    name: "MAU",
    description:
      "Monthly Active Users. Distinct users with at least one qualifying event in the trailing 30 days. Excludes internal users and bots.",
    formula: "COUNT(DISTINCT user_id) WHERE event_ts >= NOW() - INTERVAL '30 days' AND is_internal = false",
    owner: "Priya Patel",
    source: "Snowflake / Events",
    domain: "Product",
    usedIn: ["Product Health", "Growth Review"],
    confirmedAt: null,
    status: "draft",
    serveToAi: false,
  },
  {
    id: "def_dau",
    name: "DAU",
    description: "Daily Active Users. Distinct non-internal users with at least one qualifying event on a given calendar day (UTC).",
    formula: "COUNT(DISTINCT user_id) WHERE event_date = TODAY AND is_internal = false",
    owner: "Priya Patel",
    source: "Snowflake / Events",
    domain: "Product",
    usedIn: ["Product Health"],
    confirmedAt: "2025-05-09",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_cac",
    name: "CAC",
    description:
      "Customer Acquisition Cost. Fully-loaded sales and marketing spend in the period, divided by new customers acquired in the same period.",
    formula: "(sales_spend + marketing_spend) / new_customers",
    owner: "Dana Wells",
    source: "Manual",
    domain: "Growth",
    usedIn: ["Growth Review", "Board Deck Q4"],
    confirmedAt: "2025-03-30",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_ltv",
    name: "LTV",
    description: "Customer Lifetime Value. Average revenue per account × gross margin / monthly logo churn rate.",
    formula: "(ARPA * gross_margin) / monthly_logo_churn",
    owner: "Dana Wells",
    source: "Manual",
    domain: "Growth",
    usedIn: ["Growth Review"],
    confirmedAt: "2025-04-02",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_nps",
    name: "NPS",
    description: "Net Promoter Score. % Promoters (9-10) minus % Detractors (0-6) from the trailing 90-day survey window.",
    formula: "(promoters - detractors) / total_responses * 100",
    owner: "Marcus Liu",
    source: "Manual",
    domain: "Customer Success",
    usedIn: ["CS Weekly"],
    confirmedAt: null,
    status: "draft",
    serveToAi: false,
  },
  {
    id: "def_pipeline",
    name: "Qualified Pipeline",
    description:
      "Sum of open opportunity ACV at Stage 2 (Discovery) or later. Excludes Closed Lost and opportunities older than 180 days.",
    formula: "SUM(opp.acv) WHERE stage >= 2 AND status = 'open' AND age_days < 180",
    owner: "Tom Reyes",
    source: "Salesforce",
    domain: "Sales",
    usedIn: ["Sales Forecast"],
    confirmedAt: "2025-05-15",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_win_rate",
    name: "Win Rate",
    description: "Closed Won opportunities divided by all closed opportunities (Won + Lost) in the period.",
    formula: "COUNT(opp WHERE stage = 'Won') / COUNT(opp WHERE stage IN ('Won','Lost'))",
    owner: "Tom Reyes",
    source: "Salesforce",
    domain: "Sales",
    usedIn: ["Sales Forecast", "QBR Template"],
    confirmedAt: "2025-04-28",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_active_customer",
    name: "Active Customer",
    description: "An account with at least one paid subscription that has not entered a cancelled or suspended state.",
    formula: "accounts WHERE has_active_subscription = true",
    owner: "Marcus Liu",
    source: "Power BI / CS",
    domain: "Customer Success",
    usedIn: ["Retention Dashboard", "QBR Template"],
    confirmedAt: "2025-05-08",
    status: "tested",
    serveToAi: true,
  },
  {
    id: "def_payback",
    name: "CAC Payback",
    description: "Months required to recoup CAC, defined as CAC divided by (ARPA × gross margin).",
    formula: "CAC / (ARPA * gross_margin)",
    owner: "Dana Wells",
    source: "Manual",
    domain: "Growth",
    usedIn: ["Board Deck Q4"],
    confirmedAt: null,
    status: "draft",
    serveToAi: false,
  },
  {
    id: "def_activation",
    name: "Activation Rate",
    description: "Percent of new signups who complete the activation event (first published report) within 7 days.",
    formula: "COUNT(activated_users) / COUNT(signups) WHERE signup_age <= 7d",
    owner: "Priya Patel",
    source: "Snowflake / Events",
    domain: "Product",
    usedIn: ["Product Health", "Growth Review"],
    confirmedAt: "2025-05-04",
    status: "tested",
    serveToAi: true,
  },
];

// Synthetic filler so the table demonstrates scale. Deterministic — no Math.random/Date.now.
const fillerDomains = ["Finance", "Product", "Sales", "Customer Success", "Growth", "Marketing"];
const fillerOwners = ["Sarah Chen", "Marcus Liu", "Priya Patel", "Tom Reyes", "Dana Wells", "Alex Kim"];
const fillerSources = ["Power BI / Finance", "Snowflake / Events", "Salesforce", "Manual", "Power BI / CS"];

const fillerNames = [
  "Trial-to-Paid Rate", "Avg Deal Size", "Sales Cycle Length", "Free Tier Conversion",
  "Expansion MRR", "Downgrade MRR", "Bookings", "Billings", "Deferred Revenue", "Backlog",
  "Cohort Retention M3", "Cohort Retention M6", "Cohort Retention M12", "Feature Adoption",
  "Time to First Value", "Stickiness (DAU/MAU)", "Avg Session Length", "Sessions per User",
  "Support Ticket Volume", "First Response Time", "CSAT", "Time to Resolution",
  "Marketing Qualified Leads", "Sales Qualified Leads", "Email Open Rate", "Email CTR",
  "Webinar Attendance", "Demo Booked Rate", "Demo Show Rate", "Inbound Pipeline",
  "Outbound Pipeline", "Pipeline Coverage", "Forecast Accuracy", "Quota Attainment",
  "Rep Productivity", "Net New ARR", "Gross New ARR", "Expansion ARR", "Churned ARR",
  "Magic Number", "Burn Multiple", "Runway Months", "Cash Conversion Score",
];

const filler: Definition[] = fillerNames.map((name, i) => {
  const owner = fillerOwners[i % fillerOwners.length];
  const domain = fillerDomains[i % fillerDomains.length];
  const source = fillerSources[i % fillerSources.length];
  const tested = i % 3 !== 0;
  return {
    id: `def_filler_${i}`,
    name,
    description: `${name} — definition synced from ${source}. Review pending.`,
    formula: `-- ${name.toLowerCase().replace(/\s+/g, "_")} pending`,
    owner,
    source,
    domain,
    usedIn: i % 2 === 0 ? ["Finance Weekly"] : ["Board Deck Q4", "QBR Template"],
    confirmedAt: tested ? `2025-0${(i % 5) + 1}-${10 + (i % 18)}` : null,
    status: tested ? "tested" : "draft",
    serveToAi: i % 4 !== 0,
  };
});

export const definitions: Definition[] = [...base, ...filler];

export interface TestQuestion {
  id: string;
  definitionId: string;
  question: string;
  criteria: string[];
  baselineResponse: string;
  cmResponse: string;
  baselinePass: boolean[];
  cmPass: boolean[];
}

export const testQuestions: TestQuestion[] = [
  {
    id: "q1",
    definitionId: "def_net_revenue",
    question: "Does revenue include professional services?",
    criteria: ["Must say no", "Must mention professional services are excluded", "Must reference net ARR basis"],
    baselineResponse:
      "Yes, revenue typically includes all income streams including professional services unless otherwise specified.",
    cmResponse:
      "No. Net Revenue at this company explicitly excludes professional services, one-time fees, and refunds. It is reported on a net ARR basis.",
    baselinePass: [false, false, false],
    cmPass: [true, true, true],
  },
  {
    id: "q2",
    definitionId: "def_net_revenue",
    question: "How is Net Revenue calculated?",
    criteria: ["Must reference subscription invoice lines", "Must subtract refunds", "Must mention paid status"],
    baselineResponse: "Net Revenue is gross revenue minus discounts, returns, and allowances.",
    cmResponse:
      "Net Revenue = SUM of paid subscription invoice lines for the period, minus refunds. Only invoices with status = 'paid' and type = 'subscription' are included.",
    baselinePass: [false, false, false],
    cmPass: [true, true, true],
  },
  {
    id: "q3",
    definitionId: "def_net_revenue",
    question: "Is Net Revenue the same as MRR × 12?",
    criteria: ["Must say no", "Must explain MRR is recurring while net revenue is recognized"],
    baselineResponse: "Yes, you can approximate annual revenue by multiplying MRR by 12.",
    cmResponse:
      "No. MRR × 12 is an annualized run-rate of active subscriptions. Net Revenue is the revenue actually recognized in the period from paid subscription invoices minus refunds.",
    baselinePass: [false, false],
    cmPass: [true, true],
  },
  {
    id: "q4",
    definitionId: "def_logo_churn",
    question: "Is logo churn weighted by revenue?",
    criteria: ["Must say no", "Must mention it's account count based"],
    baselineResponse: "Logo churn is typically revenue-weighted to reflect customer value.",
    cmResponse: "No. Logo Churn is the count of churned accounts divided by total accounts at the start of the period. It is not weighted by revenue.",
    baselinePass: [false, false],
    cmPass: [true, true],
  },
  {
    id: "q5",
    definitionId: "def_logo_churn",
    question: "What's the difference between logo churn and revenue churn?",
    criteria: ["Must distinguish account count vs revenue", "Must reference downgrades for revenue churn"],
    baselineResponse: "They are essentially the same metric expressed differently.",
    cmResponse:
      "Logo Churn counts cancelled accounts. Revenue Churn measures lost MRR from cancellations AND downgrades, divided by starting MRR. They can move independently.",
    baselinePass: [false, false],
    cmPass: [true, true],
  },
  {
    id: "q6",
    definitionId: "def_mrr",
    question: "Does MRR include professional services?",
    criteria: ["Must say no", "Must reference subscription-only"],
    baselineResponse: "MRR usually represents recurring revenue, which may include services if recurring.",
    cmResponse: "No. MRR includes only active subscription contract values, normalized monthly. Professional services are excluded.",
    baselinePass: [false, false],
    cmPass: [true, true],
  },
  {
    id: "q7",
    definitionId: "def_cac",
    question: "What's included in CAC?",
    criteria: ["Must mention fully-loaded S&M spend", "Must reference new customers in same period"],
    baselineResponse: "CAC is marketing spend divided by new customers.",
    cmResponse:
      "CAC = (fully-loaded sales spend + marketing spend) for the period, divided by new customers acquired in the same period. Sales spend is included, not just marketing.",
    baselinePass: [false, false],
    cmPass: [true, true],
  },
];

export interface ActivityEntry {
  id: string;
  ts: string;
  agent: string;
  tool: "search_definitions" | "get_definition" | "get_lineage" | "get_impact" | "search_assets" | "get_asset";
  input: string;
  definitionName: string | null;
  latencyMs: number;
}

// Deterministic: derived from a fixed reference timestamp so SSR & client match.
const REF_TS = Date.parse("2025-05-23T14:00:00Z");
const agents = ["Copilot Studio", "Claude MCP", "Custom Agent", "Cursor"];
const tools: ActivityEntry["tool"][] = ["search_definitions", "get_definition", "get_lineage", "get_impact"];
const inputs = ["what is revenue", "churn definition", "MRR calculation", "active customer", "CAC formula"];
const latencies = [62, 88, 104, 71, 145, 53, 91, 116, 78, 132];

export const activityLog: ActivityEntry[] = Array.from({ length: 42 }, (_, i) => {
  const def = definitions[i % definitions.length];
  const minutesAgo = i * 7 + (i % 5);
  return {
    id: `act_${i}`,
    ts: new Date(REF_TS - minutesAgo * 60_000).toISOString(),
    agent: agents[i % agents.length],
    tool: tools[i % tools.length],
    input: inputs[i % inputs.length],
    definitionName: def.name,
    latencyMs: latencies[i % latencies.length],
  };
});

export const dataSources = [
  {
    id: "src_pbi",
    name: "Contoso Power BI Workspace",
    type: "Power BI",
    status: "connected" as const,
    summary: "47 measures across 12 datasets",
    lastSync: "2 hours ago",
  },
  {
    id: "src_snow",
    name: "Snowflake — Analytics",
    type: "SQL",
    status: "connected" as const,
    summary: "138 tables, 12 marts",
    lastSync: "yesterday",
  },
  {
    id: "src_sfdc",
    name: "Salesforce Production",
    type: "Salesforce",
    status: "error" as const,
    summary: "Auth token expired",
    lastSync: "5 days ago",
  },
];

export const llmKeys = [
  { id: "k1", provider: "OpenAI", model: "gpt-4o", status: "valid" as const, added: "2025-03-12" },
  { id: "k2", provider: "Anthropic", model: "claude-sonnet-4", status: "valid" as const, added: "2025-04-02" },
];

export const availableModels = ["gpt-4o", "gpt-4o-mini", "claude-sonnet-4", "claude-opus-4"];
