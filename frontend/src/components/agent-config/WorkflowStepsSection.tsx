import { useState } from "react";
import { SectionCard } from "@/components/practice/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkflowConfig, WorkflowStep } from "@/api/agentConfigs";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

interface WorkflowStepsSectionProps {
  config: WorkflowConfig;
  onChange: (config: WorkflowConfig) => void;
}

export function WorkflowStepsSection({
  config,
  onChange,
}: WorkflowStepsSectionProps) {
  const [newStep, setNewStep] = useState("");
  const steps = [...config.steps].sort((a, b) => a.order - b.order);

  function updateStep(index: number, text: string) {
    const updated = steps.map((s, i) =>
      i === index ? { ...s, step: text } : s,
    );
    onChange({ steps: updated });
  }

  function removeStep(index: number) {
    const updated = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, order: i + 1 }));
    onChange({ steps: updated });
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange({ steps: updated.map((s, i) => ({ ...s, order: i + 1 })) });
  }

  function addStep() {
    const text = newStep.trim();
    if (!text) return;
    const step: WorkflowStep = { order: steps.length + 1, step: text };
    onChange({ steps: [...steps, step] });
    setNewStep("");
  }

  return (
    <SectionCard title="Workflow Steps">
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 text-center text-sm text-muted-foreground">
              {s.order}.
            </span>
            <Input
              value={s.step}
              onChange={(e) => updateStep(i, e.target.value)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveStep(i, -1)}
              disabled={i === 0}
              className="h-8 w-8"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveStep(i, 1)}
              disabled={i === steps.length - 1}
              className="h-8 w-8"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeStep(i)}
              className="h-8 w-8 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-2">
          <span className="w-6" />
          <Input
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addStep()}
            placeholder="Add a workflow step..."
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={addStep}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
