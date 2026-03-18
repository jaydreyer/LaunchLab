import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./SectionCard";
import { Plus, X } from "lucide-react";
import type { InsuranceRules } from "@/api/practices";

interface InsuranceRulesSectionProps {
  rules: InsuranceRules;
  onChange: (rules: InsuranceRules) => void;
}

type InsuranceCategory = keyof InsuranceRules;

const CATEGORY_LABELS: Record<InsuranceCategory, string> = {
  accepted: "Accepted",
  not_accepted: "Not Accepted",
  uncertain: "Uncertain",
};

const CATEGORY_VARIANTS: Record<
  InsuranceCategory,
  "default" | "destructive" | "outline"
> = {
  accepted: "default",
  not_accepted: "destructive",
  uncertain: "outline",
};

export function InsuranceRulesSection({
  rules,
  onChange,
}: InsuranceRulesSectionProps) {
  const [inputs, setInputs] = useState<Record<InsuranceCategory, string>>({
    accepted: "",
    not_accepted: "",
    uncertain: "",
  });

  function addItem(category: InsuranceCategory) {
    const value = inputs[category].trim();
    if (!value || rules[category].includes(value)) return;
    onChange({
      ...rules,
      [category]: [...rules[category], value],
    });
    setInputs({ ...inputs, [category]: "" });
  }

  function removeItem(category: InsuranceCategory, item: string) {
    onChange({
      ...rules,
      [category]: rules[category].filter((i) => i !== item),
    });
  }

  function handleKeyDown(category: InsuranceCategory, e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(category);
    }
  }

  return (
    <SectionCard title="Insurance Rules">
      <div className="space-y-4">
        {(Object.keys(CATEGORY_LABELS) as InsuranceCategory[]).map(
          (category) => (
            <div key={category}>
              <h4 className="mb-2 text-sm font-medium">
                {CATEGORY_LABELS[category]}
              </h4>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {rules[category].map((item) => (
                  <Badge
                    key={item}
                    variant={CATEGORY_VARIANTS[category]}
                    className="gap-1"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeItem(category, item)}
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
                  placeholder={`Add ${CATEGORY_LABELS[category].toLowerCase()} insurer...`}
                  className="max-w-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addItem(category)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ),
        )}
      </div>
    </SectionCard>
  );
}
