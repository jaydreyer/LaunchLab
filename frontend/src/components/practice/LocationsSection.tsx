import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./SectionCard";
import { Trash2, Plus } from "lucide-react";
import type { Location } from "@/api/practices";

interface LocationsSectionProps {
  locations: Record<string, Location>;
  onChange: (locations: Record<string, Location>) => void;
}

export function LocationsSection({
  locations,
  onChange,
}: LocationsSectionProps) {
  const entries = Object.entries(locations);

  function updateLocation(
    key: string,
    field: keyof Location,
    value: string | boolean,
  ) {
    onChange({
      ...locations,
      [key]: { ...locations[key], [field]: value },
    });
  }

  function removeLocation(key: string) {
    const next = { ...locations };
    delete next[key];
    onChange(next);
  }

  function addLocation() {
    const key = `location_${Date.now()}`;
    onChange({
      ...locations,
      [key]: {
        name: "",
        address: "",
        phone: "",
        same_day_sick_visits: false,
      },
    });
  }

  return (
    <SectionCard title="Locations">
      <div className="space-y-4">
        {entries.map(([key, loc]) => (
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
                onClick={() => removeLocation(key)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input
                  value={loc.name}
                  onChange={(e) => updateLocation(key, "name", e.target.value)}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={loc.phone}
                  onChange={(e) => updateLocation(key, "phone", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Input
                  value={loc.address}
                  onChange={(e) =>
                    updateLocation(key, "address", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={loc.same_day_sick_visits}
                onCheckedChange={(checked) =>
                  updateLocation(key, "same_day_sick_visits", checked)
                }
              />
              <Label>Same-day sick visits</Label>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addLocation}>
          <Plus className="mr-1 h-4 w-4" /> Add Location
        </Button>
      </div>
    </SectionCard>
  );
}
