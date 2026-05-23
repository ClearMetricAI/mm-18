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
  baselineReasons: string[];
  cmReasons: string[];
}

export const judgeModel = "gpt-4o-mini";

export const testQuestions: TestQuestion[] = [
  {
    id: "q1",
    definitionId: "def_net_revenue",
    question: "Does revenue include professional services?",
    criteria: ["Answer is 'no'", "Mentions professional services are excluded", "References net ARR basis"],
    baselineResponse:
      "Yes, revenue typically includes all income streams including professional services unless otherwise specified.",
    cmResponse:
      "No. Net Revenue at this company explicitly excludes professional services, one-time fees, and refunds. It is reported on a net ARR basis.",
    baselinePass: [false, false, false],
    cmPass: [true, true, true],
    baselineReasons: [
      "Answer says 'yes' — opposite of expected.",
      "Does not mention professional services as excluded.",
      "No reference to ARR or net basis.",
    ],
    cmReasons: [
      "Answer begins with 'No.' — matches.",
      "Explicitly lists professional services as excluded.",
      "States 'reported on a net ARR basis'.",
    ],
  },
  {
    id: "q2",
    definitionId: "def_net_revenue",
    question: "How is Net Revenue calculated?",
    criteria: ["References subscription invoice lines", "Subtracts refunds", "Mentions paid status filter"],
    baselineResponse: "Net Revenue is gross revenue minus discounts, returns, and allowances.",
    cmResponse:
      "Net Revenue = SUM of paid subscription invoice lines for the period, minus refunds. Only invoices with status = 'paid' and type = 'subscription' are included.",
    baselinePass: [false, false, false],
    cmPass: [true, true, true],
    baselineReasons: [
      "Generic accounting definition; no invoice line reference.",
      "Says 'returns' not 'refunds' — not the company term.",
      "No mention of paid status.",
    ],
    cmReasons: [
      "Uses 'subscription invoice lines' verbatim.",
      "Explicit 'minus refunds'.",
      "Filters on status = 'paid'.",
    ],
  },
  {
    id: "q3",
    definitionId: "def_net_revenue",
    question: "Is Net Revenue the same as MRR × 12?",
    criteria: ["Answer is 'no'", "Distinguishes recurring run-rate from recognized revenue"],
    baselineResponse: "Yes, you can approximate annual revenue by multiplying MRR by 12.",
    cmResponse:
      "No. MRR × 12 is an annualized run-rate of active subscriptions. Net Revenue is the revenue actually recognized in the period from paid subscription invoices minus refunds.",
    baselinePass: [false, false],
    cmPass: [true, true],
    baselineReasons: [
      "Says 'yes' — opposite of expected.",
      "Treats MRR × 12 as equivalent; misses the distinction.",
    ],
    cmReasons: [
      "Answer begins with 'No.' — matches.",
      "Clearly contrasts run-rate vs recognized revenue.",
    ],
  },
  {
    id: "q4",
    definitionId: "def_logo_churn",
    question: "Is logo churn weighted by revenue?",
    criteria: ["Answer is 'no'", "States it is account-count based"],
    baselineResponse: "Logo churn is typically revenue-weighted to reflect customer value.",
    cmResponse:
      "No. Logo Churn is the count of churned accounts divided by total accounts at the start of the period. It is not weighted by revenue.",
    baselinePass: [false, false],
    cmPass: [true, true],
    baselineReasons: [
      "Says it is weighted — opposite of expected.",
      "No mention of account counts.",
    ],
    cmReasons: ["Explicit 'No.'", "Defines as account count over starting accounts."],
  },
  {
    id: "q5",
    definitionId: "def_logo_churn",
    question: "What's the difference between logo churn and revenue churn?",
    criteria: ["Distinguishes account count vs revenue", "References downgrades for revenue churn"],
    baselineResponse: "They are essentially the same metric expressed differently.",
    cmResponse:
      "Logo Churn counts cancelled accounts. Revenue Churn measures lost MRR from cancellations AND downgrades, divided by starting MRR. They can move independently.",
    baselinePass: [false, false],
    cmPass: [true, true],
    baselineReasons: ["Conflates the two metrics.", "No mention of downgrades."],
    cmReasons: ["Clear contrast: account count vs MRR.", "Explicitly includes downgrades."],
  },
  {
    id: "q6",
    definitionId: "def_mrr",
    question: "Does MRR include professional services?",
    criteria: ["Answer is 'no'", "References subscription-only scope"],
    baselineResponse: "MRR usually represents recurring revenue, which may include services if recurring.",
    cmResponse:
      "No. MRR includes only active subscription contract values, normalized monthly. Professional services are excluded.",
    baselinePass: [false, false],
    cmPass: [true, true],
    baselineReasons: ["Hedges with 'may include' — not a clear no.", "Doesn't constrain to subscriptions."],
    cmReasons: ["Explicit 'No.'", "States 'only active subscription contract values'."],
  },
  {
    id: "q7",
    definitionId: "def_cac",
    question: "What's included in CAC?",
    criteria: ["Mentions fully-loaded S&M spend", "References new customers in same period"],
    baselineResponse: "CAC is marketing spend divided by new customers.",
    cmResponse:
      "CAC = (fully-loaded sales spend + marketing spend) for the period, divided by new customers acquired in the same period. Sales spend is included, not just marketing.",
    baselinePass: [false, false],
    cmPass: [true, true],
    baselineReasons: ["Omits sales spend entirely.", "Doesn't specify same-period matching."],
    cmReasons: ["Explicitly 'fully-loaded sales + marketing'.", "Matches new customers to same period."],
  },
  {
    id: "q8",
    definitionId: "def_mau",
    question: "Are internal users counted in MAU?",
    criteria: ["Answer is 'no'", "References 30-day window", "Mentions bot exclusion"],
    baselineResponse: "MAU usually counts all active users in the past month.",
    cmResponse:
      "No. MAU excludes internal users and bots. It counts distinct users with at least one qualifying event in the trailing 30 days.",
    baselinePass: [false, false, false],
    cmPass: [true, true, true],
    baselineReasons: [
      "Doesn't exclude internal users.",
      "Says 'past month', not trailing 30 days.",
      "No mention of bots.",
    ],
    cmReasons: ["Explicit 'No.'", "Uses 'trailing 30 days' verbatim.", "Explicitly excludes bots."],
  },
  {
    id: "q9",
    definitionId: "def_nrr",
    question: "Does NRR include new business?",
    criteria: ["Answer is 'no'", "Mentions cohort of customers active at period start"],
    baselineResponse: "NRR generally includes all revenue movements including new sales.",
    cmResponse:
      "No. NRR is cohort-based on customers active at the start of the period. New business is excluded — it's measured separately as new ARR.",
    baselinePass: [false, false],
    cmPass: [true, true],
    baselineReasons: ["Says new sales are included — incorrect.", "No cohort framing."],
    cmReasons: ["Explicit 'No.'", "States cohort starts at period start."],
  },
  {
    id: "q10",
    definitionId: "def_pipeline",
    question: "What stages count toward Qualified Pipeline?",
    criteria: ["Mentions Stage 2 (Discovery) or later", "Excludes Closed Lost", "References 180-day age cap"],
    baselineResponse: "Qualified pipeline is usually anything past initial qualification.",
    cmResponse:
      "Qualified Pipeline = open opportunities at Stage 2 (Discovery) or later, with ACV summed. Closed Lost is excluded, and opportunities older than 180 days are dropped.",
    baselinePass: [false, false, false],
    cmPass: [true, true, true],
    baselineReasons: ["Vague — no specific stage.", "Doesn't mention Closed Lost.", "No age cap."],
    cmReasons: ["Names 'Stage 2 (Discovery) or later'.", "Explicitly excludes Closed Lost.", "Cites 180-day cap."],
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
export const REF_TS = Date.parse("2025-05-23T14:00:00Z");
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

// Coverage gaps — queries AI agents asked but no served definition matched.
// This is the highest-value insight on the Serve page: what to define next.
export interface UnmatchedQuery {
  id: string;
  query: string;
  count: number;
  lastAskedMinutesAgo: number;
  agents: string[];
  suggestedName: string;
  suggestedDomain: string;
}

export const unmatchedQueries: UnmatchedQuery[] = [
  { id: "u1", query: "what counts as a power user", count: 7, lastAskedMinutesAgo: 12, agents: ["Copilot Studio", "Claude MCP"], suggestedName: "Power User", suggestedDomain: "Product" },
  { id: "u2", query: "rule of 40 for this quarter", count: 5, lastAskedMinutesAgo: 41, agents: ["Claude MCP"], suggestedName: "Rule of 40", suggestedDomain: "Finance" },
  { id: "u3", query: "trial to paid conversion rate", count: 4, lastAskedMinutesAgo: 88, agents: ["Cursor", "Copilot Studio"], suggestedName: "Trial Conversion", suggestedDomain: "Growth" },
  { id: "u4", query: "what is our magic number", count: 3, lastAskedMinutesAgo: 134, agents: ["Claude MCP"], suggestedName: "Magic Number", suggestedDomain: "Finance" },
  { id: "u5", query: "support ticket sla", count: 3, lastAskedMinutesAgo: 210, agents: ["Custom Agent"], suggestedName: "Support SLA", suggestedDomain: "Customer Success" },
  { id: "u6", query: "burn multiple", count: 2, lastAskedMinutesAgo: 320, agents: ["Claude MCP"], suggestedName: "Burn Multiple", suggestedDomain: "Finance" },
  { id: "u7", query: "qbr revenue formula", count: 2, lastAskedMinutesAgo: 412, agents: ["Copilot Studio"], suggestedName: "QBR Revenue", suggestedDomain: "Finance" },
  { id: "u8", query: "feature stickiness for AI suite", count: 1, lastAskedMinutesAgo: 540, agents: ["Cursor"], suggestedName: "Feature Stickiness", suggestedDomain: "Product" },
];

// Most-asked definitions this week — derived counts (deterministic mock).
export interface DefinitionUsage {
  definitionId: string;
  definitionName: string;
  count: number;
}

const topUsageNames = ["Net Revenue", "Logo Churn", "MRR", "ARR", "CAC", "MAU", "Net Revenue Retention", "Qualified Pipeline"];
export const topDefinitions: DefinitionUsage[] = topUsageNames
  .map((name, i) => {
    const def = definitions.find((d) => d.name === name);
    return def
      ? { definitionId: def.id, definitionName: def.name, count: [38, 27, 22, 16, 14, 11, 9, 6][i] }
      : null;
  })
  .filter(Boolean) as DefinitionUsage[];

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
