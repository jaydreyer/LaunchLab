import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./SectionCard";
import { Trash2, Plus } from "lucide-react";
import type { AppointmentType } from "@/api/practices";

interface AppointmentTypesSectionProps {
  appointmentTypes: Record<string, AppointmentType>;
  onChange: (types: Record<string, AppointmentType>) => void;
}

export function AppointmentTypesSection({
  appointmentTypes,
  onChange,
}: AppointmentTypesSectionProps) {
  const entries = Object.entries(appointmentTypes);

  function updateType(key: string, field: string, value: unknown) {
    onChange({
      ...appointmentTypes,
      [key]: { ...appointmentTypes[key], [field]: value },
    });
  }

  function removeType(key: string) {
    const next = { ...appointmentTypes };
    delete next[key];
    onChange(next);
  }

  function addType() {
    const key = `type_${Date.now()}`;
    onChange({
      ...appointmentTypes,
      [key]: { duration_min: 30, is_new_patient_ok: false },
    });
  }

  return (
    <SectionCard title="Appointment Types">
      <div className="space-y-4">
        {entries.map(([key, apt]) => (
          <div
            key={key}
            className="flex flex-wrap items-center gap-4 rounded-md border border-border p-3"
          >
            <span className="min-w-[140px] text-sm font-medium">
              {key.replace(/_/g, " ")}
            </span>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Duration (min)</Label>
              <Input
                className="w-20"
                type="number"
                value={apt.duration_min}
                onChange={(e) =>
                  updateType(key, "duration_min", Number(e.target.value))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={apt.is_new_patient_ok}
                onCheckedChange={(checked) =>
                  updateType(key, "is_new_patient_ok", checked)
                }
              />
              <Label className="text-xs">New patients OK</Label>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => removeType(key)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addType}>
          <Plus className="mr-1 h-4 w-4" /> Add Appointment Type
        </Button>
      </div>
    </SectionCard>
  );
}
