import client from "./client";

export interface EvalCaseResponse {
  id: string;
  eval_run_id: string;
  scenario_name: string;
  session_id: string | null;
  expected_behavior: Record<string, unknown>;
  actual_behavior: Record<string, unknown> | null;
  criteria_results: Record<
    string,
    {
      description: string;
      category: string;
      is_critical: boolean;
      passed: boolean;
      reasoning: string;
      severity: string | null;
      weight: number;
    }
  > | null;
  passed: boolean | null;
  score: number | null;
  failure_reasons: Record<string, unknown> | null;
  judged_at: string | null;
}

export interface EvalRunResponse {
  id: string;
  practice_id: string;
  config_id: string;
  suite_name: string;
  status: string;
  summary: {
    overall_pass_rate?: number;
    overall_score?: number;
    pass_rate_by_category?: Record<
      string,
      { total: number; passed: number; pass_rate: number; avg_score: number }
    >;
    total_score?: number;
    failed_scenarios?: string[];
    pass_count?: number;
    fail_count?: number;
  } | null;
  started_at: string;
  completed_at: string | null;
  cases: EvalCaseResponse[];
}

export interface EvalRunSummary {
  id: string;
  practice_id: string;
  config_id: string;
  suite_name: string;
  status: string;
  summary: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
}

export interface EvalRunCreate {
  practice_id: string;
  config_id: string;
  suite_name?: string;
}

export async function startEvalRun(
  data: EvalRunCreate,
): Promise<EvalRunSummary> {
  const res = await client.post<EvalRunSummary>("/eval_runs", data);
  return res.data;
}

export async function getEvalRun(id: string): Promise<EvalRunResponse> {
  const res = await client.get<EvalRunResponse>(`/eval_runs/${id}`);
  return res.data;
}

export async function listEvalRuns(): Promise<EvalRunSummary[]> {
  const res = await client.get<EvalRunSummary[]>("/eval_runs");
  return res.data;
}
