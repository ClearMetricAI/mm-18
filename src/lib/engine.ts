// Mock "engine" — the backend moat lives here eventually.
// Frontend treats every output as a suggestion to accept / edit / dismiss.
import type { Definition, TestQuestion } from "./mock-data";

export type SuggestionKind =
  | "definition"
  | "test-question"
  | "drift"
  | "improvement"
  | "alias";

export interface BaseSuggestion {
  id: string;
  kind: SuggestionKind;
  title: string;
  rationale: string;
}

export interface DefinitionDraftSuggestion extends BaseSuggestion {
  kind: "definition";
  draft: Definition;
}

export interface TestQuestionSuggestion extends BaseSuggestion {
  kind: "test-question";
  question: string;
  criteria: string[];
}

export interface DriftSuggestion extends BaseSuggestion {
  kind: "drift";
  definitionId: string;
  note: string;
}

export interface ImprovementSuggestion extends BaseSuggestion {
  kind: "improvement";
  definitionId: string;
  field: "description" | "formula";
  before: string;
  after: string;
}

export interface AliasSuggestion extends BaseSuggestion {
  kind: "alias";
  definitionId: string;
  aliases: string[];
}

export type Suggestion =
  | DefinitionDraftSuggestion
  | TestQuestionSuggestion
  | DriftSuggestion
  | ImprovementSuggestion
  | AliasSuggestion;

let _seq = 0;
const sid = (k: string) => `sug_${k}_${++_seq}`;

// ── Producers ─────────────────────────────────────────────────────────────

export function suggestDefinitionDrafts(): DefinitionDraftSuggestion[] {
  const drafts: Array<Pick<Definition, "name" | "description" | "formula" | "source" | "domain" | "owner">> = [
    {
      name: "Pipeline Velocity",
      description:
        "Sum of qualified pipeline ACV × win rate ÷ average sales cycle length. Measured per period.",
      formula: "(SUM(qualified_acv) * win_rate) / avg_cycle_days",
      source: "Salesforce",
      domain: "Sales",
      owner: "Tom Reyes",
    },
    {
      name: "Engaged Account",
      description:
        "Account with ≥3 product events from ≥2 distinct users in the trailing 14 days. Excludes internal users.",
      formula:
        "accounts WHERE distinct_users_14d >= 2 AND events_14d >= 3 AND is_internal = false",
      source: "Snowflake / Events",
      domain: "Product",
      owner: "Priya Patel",
    },
  ];
  return drafts.map((d) => ({
    id: sid("def"),
    kind: "definition",
    title: d.name,
    rationale: `Drafted from ${d.source} — review the formula and exclusions before approving.`,
    draft: {
      id: `def_drafted_${d.name.toLowerCase().replace(/\s+/g, "_")}`,
      ...d,
      usedIn: [],
      confirmedAt: null,
      status: "draft",
      serveToAi: false,
      origin: "auto",
    },
  }));
}

export function suggestTestQuestions(def: Definition): TestQuestionSuggestion[] {
  return [
    {
      id: sid("tq"),
      kind: "test-question",
      title: `How is ${def.name} calculated?`,
      rationale: "Probes whether the AI references your formula vs. a generic textbook one.",
      question: `How is ${def.name} calculated?`,
      criteria: ["References the documented formula", "Excludes internal/test records"],
    },
    {
      id: sid("tq"),
      kind: "test-question",
      title: `What is excluded from ${def.name}?`,
      rationale: "Surfaces hedging when exclusions are present in the definition.",
      question: `What is excluded from ${def.name}?`,
      criteria: ["Lists at least one exclusion", "Does not invent exclusions not in the definition"],
    },
    {
      id: sid("tq"),
      kind: "test-question",
      title: `Is ${def.name} the same as the industry-standard version?`,
      rationale: "Catches answers that ignore company-specific overrides.",
      question: `Is ${def.name} the same as the industry-standard version?`,
      criteria: ["Acknowledges the company-specific definition", "Notes any deviation"],
    },
  ];
}

export function suggestDriftAlerts(defs: Definition[]): DriftSuggestion[] {
  return defs
    .filter((d) => d.driftFlag)
    .map((d) => ({
      id: sid("drift"),
      kind: "drift" as const,
      title: `${d.name} may be affected`,
      rationale: `Source changed ${d.driftDate ?? "recently"}.`,
      definitionId: d.id,
      note: d.driftNote ?? "Source schema changed.",
    }));
}

export function suggestImprovements(defs: Definition[]): ImprovementSuggestion[] {
  // Stand-in heuristic: definitions that don't mention "time" or "period" get a tightening suggestion.
  return defs
    .filter(
      (d) =>
        d.status === "tested" &&
        !/period|window|date|day|month|trailing/i.test(d.description),
    )
    .slice(0, 2)
    .map((d) => ({
      id: sid("imp"),
      kind: "improvement" as const,
      title: `Tighten ${d.name} description`,
      rationale:
        "No time window referenced — AI may answer period-specific questions incorrectly.",
      definitionId: d.id,
      field: "description" as const,
      before: d.description,
      after: `${d.description} Reported on a trailing 30-day window.`,
    }));
}

export function suggestAliases(def: Definition): AliasSuggestion {
  const aliasMap: Record<string, string[]> = {
    "Average Contract Value": ["ACV", "deal size", "avg deal"],
    "Net Revenue Retention": ["NRR", "net retention"],
    "Annual Recurring Revenue": ["ARR", "annual recurring"],
    "CAC Payback": ["payback period", "months to recoup"],
  };
  const guessed = aliasMap[def.name] ?? [
    def.name.split(" ").map((w) => w[0]).join(""),
    def.name.toLowerCase(),
  ];
  return {
    id: sid("alias"),
    kind: "alias",
    title: `Add aliases for ${def.name}`,
    rationale:
      "Agents may search using shorter or more common names — aliases improve discoverability.",
    definitionId: def.id,
    aliases: guessed,
  };
}

// Helper: turn a TestQuestionSuggestion into a TestQuestion row.
export function suggestionToTestQuestion(
  s: TestQuestionSuggestion,
  definitionId: string,
): TestQuestion {
  return {
    id: `q_sug_${s.id}`,
    definitionId,
    question: s.question,
    criteria: s.criteria,
    baselineResponse: "(not run yet)",
    cmResponse: "(not run yet)",
    baselinePass: s.criteria.map(() => false),
    cmPass: s.criteria.map(() => false),
    baselineReasons: s.criteria.map(() => "(not graded yet)"),
    cmReasons: s.criteria.map(() => "(not graded yet)"),
  };
}
