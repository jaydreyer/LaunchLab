import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "./SectionCard";
import type { DayHours } from "@/api/practices";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type HoursMap = Record<string, Record<string, DayHours | "closed">>;

interface HoursSectionProps {
  hours: HoursMap;
  locationKeys: string[];
  onChange: (hours: HoursMap) => void;
}

export function HoursSection({
  hours,
  locationKeys,
  onChange,
}: HoursSectionProps) {
  function updateDay(
    location: string,
    day: string,
    field: "open" | "close",
    value: string,
  ) {
    const current = hours[location]?.[day];
    const dayHours: DayHours =
      typeof current === "object" && current !== null
        ? current
        : { open: "", close: "" };

    onChange({
      ...hours,
      [location]: {
        ...hours[location],
        [day]: { ...dayHours, [field]: value },
      },
    });
  }

  function toggleClosed(location: string, day: string) {
    const current = hours[location]?.[day];
    const isClosed = current === "closed";

    onChange({
      ...hours,
      [location]: {
        ...hours[location],
        [day]: isClosed ? { open: "9:00", close: "17:00" } : "closed",
      },
    });
  }

  return (
    <SectionCard title="Hours">
      <div className="space-y-6">
        {locationKeys.map((loc) => (
          <div key={loc}>
            <h4 className="mb-3 text-sm font-medium capitalize">{loc}</h4>
            <div className="space-y-2">
              {DAYS.map((day) => {
                const val = hours[loc]?.[day];
                const isClosed = val === "closed";
                const dayHours =
                  typeof val === "object" && val !== null
                    ? val
                    : { open: "", close: "" };

                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-24 text-sm capitalize">{day}</span>
                    {isClosed ? (
                      <button
                        type="button"
                        className="text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => toggleClosed(loc, day)}
                      >
                        Closed (click to open)
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <Label className="sr-only">Open</Label>
                          <Input
                            className="w-24"
                            value={dayHours.open}
                            onChange={(e) =>
                              updateDay(loc, day, "open", e.target.value)
                            }
                            placeholder="HH:MM"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Label className="sr-only">Close</Label>
                          <Input
                            className="w-24"
                            value={dayHours.close}
                            onChange={(e) =>
                              updateDay(loc, day, "close", e.target.value)
                            }
                            placeholder="HH:MM"
                          />
                        </div>
                        <button
                          type="button"
                          className="text-sm text-muted-foreground hover:text-destructive"
                          onClick={() => toggleClosed(loc, day)}
                        >
                          Set closed
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
