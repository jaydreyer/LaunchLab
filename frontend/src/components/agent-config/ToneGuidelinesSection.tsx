import { useState } from "react";
import { SectionCard } from "@/components/practice/SectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ToneGuidelines } from "@/api/agentConfigs";
import { Plus, X } from "lucide-react";

interface ToneGuidelinesSectionProps {
  guidelines: ToneGuidelines;
  onChange: (guidelines: ToneGuidelines) => void;
}

export function ToneGuidelinesSection({
  guidelines,
  onChange,
}: ToneGuidelinesSectionProps) {
  const [newRule, setNewRule] = useState("");

  function addStyleRule() {
    const text = newRule.trim();
    if (!text) return;
    onChange({ ...guidelines, style_rules: [...guidelines.style_rules, text] });
    setNewRule("");
  }

  function removeStyleRule(index: number) {
    onChange({
      ...guidelines,
      style_rules: guidelines.style_rules.filter((_, i) => i !== index),
    });
  }

  return (
    <SectionCard title="Tone Guidelines">
      <div className="space-y-4">
        <div>
          <Label>Tone</Label>
          <Input
            value={guidelines.tone}
            onChange={(e) => onChange({ ...guidelines, tone: e.target.value })}
            placeholder="e.g., Friendly, professional, concise"
          />
        </div>
        <div>
          <Label>Style Rules</Label>
          <div className="space-y-2 mt-1">
            {guidelines.style_rules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="shrink-0">
                  {i + 1}
                </Badge>
                <span className="text-sm flex-1">{rule}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStyleRule(i)}
                  className="h-8 w-8 shrink-0 text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStyleRule()}
              placeholder="Add a style rule..."
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addStyleRule}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
