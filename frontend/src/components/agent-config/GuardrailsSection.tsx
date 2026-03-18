import { useState } from "react";
import { SectionCard } from "@/components/practice/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Guardrails } from "@/api/agentConfigs";
import { Plus, X } from "lucide-react";

interface GuardrailsSectionProps {
  guardrails: Guardrails;
  onChange: (guardrails: Guardrails) => void;
}

export function GuardrailsSection({
  guardrails,
  onChange,
}: GuardrailsSectionProps) {
  const [newRule, setNewRule] = useState("");

  function addRule() {
    const text = newRule.trim();
    if (!text) return;
    onChange({ rules: [...guardrails.rules, text] });
    setNewRule("");
  }

  function removeRule(index: number) {
    onChange({ rules: guardrails.rules.filter((_, i) => i !== index) });
  }

  function updateRule(index: number, text: string) {
    const updated = guardrails.rules.map((r, i) => (i === index ? text : r));
    onChange({ rules: updated });
  }

  return (
    <SectionCard title="Guardrails">
      <div className="space-y-2">
        {guardrails.rules.map((rule, i) => (
          <div key={i} className="flex items-start gap-2">
            <Badge variant="outline" className="mt-1.5 shrink-0">
              Rule {i + 1}
            </Badge>
            <Input
              value={rule}
              onChange={(e) => updateRule(i, e.target.value)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeRule(i)}
              className="h-8 w-8 shrink-0 text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-2">
          <Input
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addRule()}
            placeholder="Add a guardrail rule..."
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={addRule}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
