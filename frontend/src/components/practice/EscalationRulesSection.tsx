import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./SectionCard";
import { Plus, X } from "lucide-react";
import type { EscalationRules } from "@/api/practices";

interface EscalationRulesSectionProps {
  rules: EscalationRules;
  onChange: (rules: EscalationRules) => void;
}

type TriggerCategory = "urgent_symptoms" | "mental_health_crisis";

const CATEGORY_LABELS: Record<TriggerCategory, string> = {
  urgent_symptoms: "Urgent Symptoms",
  mental_health_crisis: "Mental Health Crisis",
};

export function EscalationRulesSection({
  rules,
  onChange,
}: EscalationRulesSectionProps) {
  const [inputs, setInputs] = useState<Record<TriggerCategory, string>>({
    urgent_symptoms: "",
    mental_health_crisis: "",
  });

  function addTrigger(category: TriggerCategory) {
    const value = inputs[category].trim();
    if (!value || rules[category].includes(value)) return;
    onChange({
      ...rules,
      [category]: [...rules[category], value],
    });
    setInputs({ ...inputs, [category]: "" });
  }

  function removeTrigger(category: TriggerCategory, item: string) {
    onChange({
      ...rules,
      [category]: rules[category].filter((i) => i !== item),
    });
  }

  function handleKeyDown(category: TriggerCategory, e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTrigger(category);
    }
  }

  return (
    <SectionCard title="Escalation Rules">
      <div className="space-y-4">
        {(Object.keys(CATEGORY_LABELS) as TriggerCategory[]).map((category) => (
          <div key={category}>
            <h4 className="mb-2 text-sm font-medium">
              {CATEGORY_LABELS[category]}
            </h4>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {rules[category].map((item) => (
                <Badge key={item} variant="destructive" className="gap-1">
                  {item}
                  <button
                    type="button"
                    onClick={() => removeTrigger(category, item)}
                    className="hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={inputs[category]}
                onChange={(e) =>
                  setInputs({ ...inputs, [category]: e.target.value })
                }
                onKeyDown={(e) => handleKeyDown(category, e)}
                placeholder={`Add ${CATEGORY_LABELS[category].toLowerCase()} trigger...`}
                className="max-w-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => addTrigger(category)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <div>
          <Label className="mb-1 block text-sm font-medium">
            Escalation Action
          </Label>
          <Input
            value={rules.action}
            onChange={(e) => onChange({ ...rules, action: e.target.value })}
          />
        </div>
      </div>
    </SectionCard>
  );
}
