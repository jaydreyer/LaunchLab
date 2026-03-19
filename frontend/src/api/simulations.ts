import client from "./client";

export interface ToolCallOut {
  tool_name: string;
  tool_input: Record<string, unknown>;
  status: string;
  output: Record<string, unknown>;
}

export interface EscalationOut {
  type: string;
  keyword: string;
  action: string;
}

export interface MessageResponse {
  agent_message: string;
  tool_calls: ToolCallOut[];
  escalation: EscalationOut | null;
  stop_reason: string;
}

export interface SimulationSession {
  id: string;
  practice_id: string;
  config_id: string;
  scenario_name: string | null;
  channel_mode: string;
  messages: ChatMessage[];
  outcome: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface SimulationSummary {
  id: string;
  practice_id: string;
  config_id: string;
  scenario_name: string | null;
  channel_mode: string;
  outcome: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  // Content is usually a string, but can be an array of Claude API content
  // blocks (tool_use, tool_result, text) when raw orchestrator messages are stored.
  content: string | Record<string, unknown>[];
}

export interface SimulationCreate {
  practice_id: string;
  config_id: string;
  scenario_name?: string | null;
  channel_mode?: string;
}

export interface MessageSend {
  content: string;
}

export interface ToolCallRecord {
  id: string;
  session_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: Record<string, unknown>;
  status: string;
  duration_ms: number | null;
  created_at: string;
}

export async function listSimulations(): Promise<SimulationSummary[]> {
  const res = await client.get<SimulationSummary[]>("/simulations");
  return res.data;
}

export async function createSimulation(
  data: SimulationCreate,
): Promise<SimulationSession> {
  const res = await client.post<SimulationSession>("/simulations", data);
  return res.data;
}

export async function getSimulation(id: string): Promise<SimulationSession> {
  const res = await client.get<SimulationSession>(`/simulations/${id}`);
  return res.data;
}

export async function getToolCalls(
  simulationId: string,
): Promise<ToolCallRecord[]> {
  const res = await client.get<ToolCallRecord[]>(
    `/simulations/${simulationId}/tool_calls`,
  );
  return res.data;
}

export async function sendMessage(
  simulationId: string,
  data: MessageSend,
): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(
    `/simulations/${simulationId}/messages`,
    data,
  );
  return res.data;
}
