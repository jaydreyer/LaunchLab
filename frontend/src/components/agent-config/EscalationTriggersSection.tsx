import { useState } from "react";
import { SectionCard } from "@/components/practice/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { EscalationTriggers, EscalationTrigger } from "@/api/agentConfigs";
import { Plus, Trash2, X } from "lucide-react";

interface EscalationTriggersSectionProps {
  triggers: EscalationTriggers;
  onChange: (triggers: EscalationTriggers) => void;
}

export function EscalationTriggersSection({
  triggers,
  onChange,
}: EscalationTriggersSectionProps) {
  function updateTrigger(index: number, updated: EscalationTrigger) {
    const list = triggers.triggers.map((t, i) => (i === index ? updated : t));
    onChange({ triggers: list });
  }

  function removeTrigger(index: number) {
    onChange({ triggers: triggers.triggers.filter((_, i) => i !== index) });
  }

  function addTrigger() {
    const newTrigger: EscalationTrigger = {
      type: "",
      keywords: [],
      action: "immediate_escalation",
    };
    onChange({ triggers: [...triggers.triggers, newTrigger] });
  }

  return (
    <SectionCard title="Escalation Triggers">
      <div className="space-y-4">
        {triggers.triggers.map((trigger, i) => (
          <TriggerCard
            key={i}
            trigger={trigger}
            onChange={(t) => updateTrigger(i, t)}
            onRemove={() => removeTrigger(i)}
          />
        ))}
        <Button variant="outline" size="sm" onClick={addTrigger}>
          <Plus className="mr-1 h-4 w-4" />
          Add Trigger
        </Button>
      </div>
    </SectionCard>
  );
}

function TriggerCard({
  trigger,
  onChange,
  onRemove,
}: {
  trigger: EscalationTrigger;
  onChange: (t: EscalationTrigger) => void;
  onRemove: () => void;
}) {
  const [newKeyword, setNewKeyword] = useState("");

  function addKeyword() {
    const text = newKeyword.trim();
    if (!text || trigger.keywords.includes(text)) return;
    onChange({ ...trigger, keywords: [...trigger.keywords, text] });
    setNewKeyword("");
  }

  function removeKeyword(kw: string) {
    onChange({
      ...trigger,
      keywords: trigger.keywords.filter((k) => k !== kw),
    });
  }

  return (
    <div className="rounded-md border border-border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="flex-1">
            <Label className="text-xs">Type</Label>
            <Input
              value={trigger.type}
              onChange={(e) => onChange({ ...trigger, type: e.target.value })}
              placeholder="e.g., symptom"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs">Action</Label>
            <Input
              value={trigger.action}
              onChange={(e) => onChange({ ...trigger, action: e.target.value })}
              placeholder="e.g., immediate_escalation"
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 ml-2 text-destructive shrink-0 self-end"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div>
        <Label className="text-xs">Keywords</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {trigger.keywords.map((kw) => (
            <Badge key={kw} variant="secondary" className="gap-1">
              {kw}
              <button onClick={() => removeKeyword(kw)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            placeholder="Add keyword..."
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={addKeyword}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
