// Referee core types — the data shape for Enforce (checks + tool results).
// V1 is fully mocked; these types match the production data model so swapping
// in a real engine later is a search/replace, not a redesign.

export type Tool = "cortex" | "copilot" | "genie";

export const TOOL_META: Record<
  Tool,
  { name: string; vendor: string; lang: "SQL" | "DAX"; mark: string }
> = {
  cortex: { name: "Snowflake Cortex", vendor: "Snowflake", lang: "SQL", mark: "S" },
  copilot: { name: "Power BI Copilot", vendor: "Microsoft", lang: "DAX", mark: "P" },
  genie: { name: "Databricks Genie", vendor: "Databricks", lang: "SQL", mark: "D" },
};

export type Verdict = "conforms" | "deviates";

export interface ToolResult {
  tool: Tool;
  returnedQuery: string;
  returnedResult: string;
  verdict: Verdict;
  deviationNote?: string;
}

export type CheckStatus = "deviating" | "no_standard" | "conforming";

export interface Check {
  id: string;
  questionText: string;
  /** Definition id from mock-data; null if no standard set yet. */
  definitionId: string | null;
  /** Asks per week, drives ranking. */
  frequencyScore: number;
  status: CheckStatus;
  /** Per-tool results. Empty until a standard is set. */
  toolResults: ToolResult[];
  /** Brief cause label shown on the detail card (e.g. "`orders.region` renamed"). */
  causeNote?: string;
  /** Dependency fingerprint: metadata_object ids the standard's query depends on. */
  fingerprint: string[];
}

export interface MetadataObject {
  id: string;
  qualifiedName: string;
  type: "table" | "column" | "measure";
  source: string;
  contentHash: string;
}

export interface Run {
  id: string;
  trigger: "metadata_change" | "sweep" | "suite" | "manual";
  startedAt: string;
  finishedAt: string;
  affectedCheckIds: string[];
  costUnits: number;
}
