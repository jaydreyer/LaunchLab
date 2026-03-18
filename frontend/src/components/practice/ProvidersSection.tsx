import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "./SectionCard";
import { Trash2, Plus } from "lucide-react";
import type { Provider } from "@/api/practices";

interface ProvidersSectionProps {
  providers: Record<string, Provider>;
  locationKeys: string[];
  appointmentTypeKeys: string[];
  onChange: (providers: Record<string, Provider>) => void;
}

export function ProvidersSection({
  providers,
  locationKeys,
  appointmentTypeKeys,
  onChange,
}: ProvidersSectionProps) {
  const entries = Object.entries(providers);

  function updateProvider(key: string, field: keyof Provider, value: unknown) {
    onChange({
      ...providers,
      [key]: { ...providers[key], [field]: value },
    });
  }

  function toggleArrayItem(
    key: string,
    field: "locations" | "appointment_types",
    item: string,
  ) {
    const current = providers[key][field];
    const next = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    updateProvider(key, field, next);
  }

  function removeProvider(key: string) {
    const next = { ...providers };
    delete next[key];
    onChange(next);
  }

  function addProvider() {
    const key = `provider_${Date.now()}`;
    onChange({
      ...providers,
      [key]: {
        name: "",
        title: "MD",
        locations: [],
        appointment_types: [],
        availability: {},
      },
    });
  }

  return (
    <SectionCard title="Providers">
      <div className="space-y-4">
        {entries.map(([key, prov]) => (
          <div
            key={key}
            className="rounded-md border border-border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {key}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => removeProvider(key)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input
                  value={prov.name}
                  onChange={(e) => updateProvider(key, "name", e.target.value)}
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={prov.title}
                  onChange={(e) => updateProvider(key, "title", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Locations</Label>
              <div className="flex flex-wrap gap-1.5">
                {locationKeys.map((loc) => (
                  <Badge
                    key={loc}
                    variant={
                      prov.locations.includes(loc) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem(key, "locations", loc)}
                  >
                    {loc}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Appointment Types</Label>
              <div className="flex flex-wrap gap-1.5">
                {appointmentTypeKeys.map((apt) => (
                  <Badge
                    key={apt}
                    variant={
                      prov.appointment_types.includes(apt)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      toggleArrayItem(key, "appointment_types", apt)
                    }
                  >
                    {apt.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addProvider}>
          <Plus className="mr-1 h-4 w-4" /> Add Provider
        </Button>
      </div>
    </SectionCard>
  );
}
