import client from "./client";

export interface WorkflowStep {
  order: number;
  step: string;
}

export interface WorkflowConfig {
  steps: WorkflowStep[];
}

export interface Guardrails {
  rules: string[];
}

export interface EscalationTrigger {
  type: string;
  keywords: string[];
  action: string;
}

export interface EscalationTriggers {
  triggers: EscalationTrigger[];
}

export interface ToolPolicyEntry {
  name: string;
  is_enabled: boolean;
  required_before?: string;
  use_when?: string;
}

export interface ToolPolicy {
  tools: ToolPolicyEntry[];
}

export interface ToneGuidelines {
  tone: string;
  style_rules: string[];
}

export interface AgentConfig {
  id: string;
  practice_id: string;
  version: number;
  system_prompt: string;
  workflow_config: WorkflowConfig;
  guardrails: Guardrails;
  escalation_triggers: EscalationTriggers;
  tool_policy: ToolPolicy;
  tone_guidelines: ToneGuidelines;
  created_at: string;
  updated_at: string;
}

export type AgentConfigUpdate = Partial<
  Pick<
    AgentConfig,
    | "system_prompt"
    | "workflow_config"
    | "guardrails"
    | "escalation_triggers"
    | "tool_policy"
    | "tone_guidelines"
  >
>;

export interface AgentConfigPreviewRequest {
  practice_id: string;
  system_prompt: string;
  workflow_config: WorkflowConfig;
  guardrails: Guardrails;
  escalation_triggers: EscalationTriggers;
  tool_policy: ToolPolicy;
  tone_guidelines: ToneGuidelines;
}

export interface AgentConfigPreviewResponse {
  assembled_prompt: string;
}

export async function listAgentConfigs(): Promise<AgentConfig[]> {
  const res = await client.get<AgentConfig[]>("/agent_configs");
  return res.data;
}

export async function getAgentConfig(id: string): Promise<AgentConfig> {
  const res = await client.get<AgentConfig>(`/agent_configs/${id}`);
  return res.data;
}

export async function updateAgentConfig(
  id: string,
  data: AgentConfigUpdate,
): Promise<AgentConfig> {
  const res = await client.patch<AgentConfig>(`/agent_configs/${id}`, data);
  return res.data;
}

export async function resetAgentConfig(
  practiceId: string,
): Promise<AgentConfig> {
  const res = await client.post<AgentConfig>(
    `/agent_config_resets?practice_id=${encodeURIComponent(practiceId)}`,
  );
  return res.data;
}

export async function previewAgentConfig(
  data: AgentConfigPreviewRequest,
): Promise<string> {
  const res = await client.post<AgentConfigPreviewResponse>(
    "/agent_config_previews",
    data,
  );
  return res.data.assembled_prompt;
}
