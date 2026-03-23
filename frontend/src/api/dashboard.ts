import client from "./client";

export interface CategoryScore {
  category: string;
  pass_rate: number;
  avg_score: number;
  case_count: number;
  status: string;
}

export interface FailureTheme {
  theme: string;
  count: number;
  severity: string;
  affected_scenarios: string[];
}

export interface ReadinessResponse {
  overall_score: number;
  readiness_level: string;
  recommendation: string;
  category_scores: CategoryScore[];
  failure_themes: FailureTheme[];
  constraints: string[];
  eval_run_id: string;
  eval_run_date: string;
  scenario_count: number;
  pass_count: number;
}

export async function getReadiness(
  practiceId: string,
): Promise<ReadinessResponse> {
  const res = await client.get<ReadinessResponse>("/dashboard/readiness", {
    params: { practice_id: practiceId },
  });
  return res.data;
}

export async function exportReadinessReport(
  practiceId: string,
): Promise<string> {
  const res = await client.get<string>("/dashboard/readiness/export", {
    params: { practice_id: practiceId },
    responseType: "text",
  });
  return res.data;
}
