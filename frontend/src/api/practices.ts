import client from "./client";

export interface Practice {
  id: string;
  name: string;
  locations: Record<string, Location>;
  providers: Record<string, Provider>;
  hours: Record<string, Record<string, DayHours | "closed">>;
  appointment_types: Record<string, AppointmentType>;
  insurance_rules: InsuranceRules;
  escalation_rules: EscalationRules;
  created_at: string;
  updated_at: string;
}

export interface Location {
  name: string;
  address: string;
  phone: string;
  same_day_sick_visits: boolean;
}

export interface Provider {
  name: string;
  title: string;
  locations: string[];
  appointment_types: string[];
  availability: Record<string, string[]>;
}

export interface DayHours {
  open: string;
  close: string;
}

export interface AppointmentType {
  duration_min: number;
  is_new_patient_ok: boolean;
  providers?: string[];
  same_day_only_at?: string[];
}

export interface InsuranceRules {
  accepted: string[];
  not_accepted: string[];
  uncertain: string[];
}

export interface EscalationRules {
  urgent_symptoms: string[];
  mental_health_crisis: string[];
  action: string;
}

export type PracticeUpdate = Partial<
  Pick<
    Practice,
    | "name"
    | "locations"
    | "providers"
    | "hours"
    | "appointment_types"
    | "insurance_rules"
    | "escalation_rules"
  >
>;

export async function listPractices(): Promise<Practice[]> {
  const res = await client.get<Practice[]>("/practices");
  return res.data;
}

export async function getPractice(id: string): Promise<Practice> {
  const res = await client.get<Practice>(`/practices/${id}`);
  return res.data;
}

export async function updatePractice(
  id: string,
  data: PracticeUpdate,
): Promise<Practice> {
  const res = await client.patch<Practice>(`/practices/${id}`, data);
  return res.data;
}

export async function resetPractice(): Promise<Practice> {
  const res = await client.post<Practice>("/practice_resets");
  return res.data;
}

export async function loadSamplePractice(): Promise<Practice> {
  const res = await client.post<Practice>("/practice_resets");
  return res.data;
}
