import { SectionCard } from "@/components/practice/SectionCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ToolPolicy, ToolPolicyEntry } from "@/api/agentConfigs";

interface ToolPolicySectionProps {
  policy: ToolPolicy;
  onChange: (policy: ToolPolicy) => void;
}

export function ToolPolicySection({
  policy,
  onChange,
}: ToolPolicySectionProps) {
  function toggleTool(index: number) {
    const updated = policy.tools.map((t, i) =>
      i === index ? { ...t, is_enabled: !t.is_enabled } : t,
    );
    onChange({ tools: updated });
  }

  function formatConstraints(tool: ToolPolicyEntry): string {
    const parts: string[] = [];
    if (tool.required_before)
      parts.push(`Required before: ${tool.required_before}`);
    if (tool.use_when) parts.push(`Use when: ${tool.use_when}`);
    return parts.join(" | ");
  }

  return (
    <SectionCard title="Tool Policy">
      <div className="space-y-3">
        {policy.tools.map((tool, i) => (
          <div
            key={tool.name}
            className="flex items-center justify-between rounded-md border border-border p-3"
          >
            <div className="space-y-0.5">
              <div className="font-mono text-sm">{tool.name}</div>
              {formatConstraints(tool) && (
                <div className="text-xs text-muted-foreground">
                  {formatConstraints(tool)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">
                {tool.is_enabled ? "Enabled" : "Disabled"}
              </Label>
              <Switch
                checked={tool.is_enabled}
                onCheckedChange={() => toggleTool(i)}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
