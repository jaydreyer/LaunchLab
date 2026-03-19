import client from "./client";

export interface ScenarioSummary {
  name: string;
  label: string;
  description: string;
  category: string;
  expected_outcome: string;
}

export interface ScenarioDetail extends ScenarioSummary {
  patient_persona: string;
  evaluation_criteria: string[];
  tool_overrides: Record<string, unknown>;
}

export async function listScenarios(): Promise<ScenarioSummary[]> {
  const res = await client.get<ScenarioSummary[]>("/scenarios");
  return res.data;
}

export async function getScenario(name: string): Promise<ScenarioDetail> {
  const res = await client.get<ScenarioDetail>(`/scenarios/${name}`);
  return res.data;
}
