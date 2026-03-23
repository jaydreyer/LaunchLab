import { useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { SystemPromptSection } from "@/components/agent-config/SystemPromptSection";
import { WorkflowStepsSection } from "@/components/agent-config/WorkflowStepsSection";
import { GuardrailsSection } from "@/components/agent-config/GuardrailsSection";
import { EscalationTriggersSection } from "@/components/agent-config/EscalationTriggersSection";
import { ToolPolicySection } from "@/components/agent-config/ToolPolicySection";
import { ToneGuidelinesSection } from "@/components/agent-config/ToneGuidelinesSection";
import { PromptPreviewPanel } from "@/components/agent-config/PromptPreviewPanel";
import { useAgentConfigStore } from "@/stores/agentConfigStore";
import { Bot, Loader2, RotateCcw, Save } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import type { AgentConfig as AgentConfigType } from "@/api/agentConfigs";

export default function AgentConfig() {
  const {
    config,
    preview,
    loading,
    saving,
    previewLoading,
    error,
    fetchCurrent,
    save,
    reset,
    setConfig,
  } = useAgentConfigStore();

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  function updateField<K extends keyof AgentConfigType>(
    field: K,
    value: AgentConfigType[K],
  ) {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  }

  async function handleSave() {
    if (!config) return;
    try {
      await save(config.id, {
        system_prompt: config.system_prompt,
        workflow_config: config.workflow_config,
        guardrails: config.guardrails,
        escalation_triggers: config.escalation_triggers,
        tool_policy: config.tool_policy,
        tone_guidelines: config.tone_guidelines,
      });
      toast.success("Agent config saved successfully");
    } catch {
      toast.error("Failed to save agent config");
    }
  }

  async function handleReset() {
    if (!config) return;
    try {
      await reset(config.practice_id);
      toast.success("Agent config reset to defaults");
    } catch {
      toast.error("Failed to reset agent config");
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Agent Config"
          description="Customize the healthcare agent's behavior."
        />
        <LoadingState message="Loading agent configuration..." />
      </div>
    );
  }

  if (!config && !loading) {
    return (
      <div>
        <PageHeader
          title="Agent Config"
          description="Customize the healthcare agent's behavior."
        />
        {error && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <EmptyState
          icon={Bot}
          heading="No agent config found"
          description="Load a practice first in Practice Setup, then the agent config will be generated automatically."
        />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div>
      <PageHeader
        title="Agent Config"
        description="Customize the healthcare agent's system prompt, workflow steps, guardrails, and tool policies."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <SystemPromptSection
            value={config.system_prompt}
            onChange={(v) => updateField("system_prompt", v)}
          />
          <WorkflowStepsSection
            config={config.workflow_config}
            onChange={(v) => updateField("workflow_config", v)}
          />
          <GuardrailsSection
            guardrails={config.guardrails}
            onChange={(v) => updateField("guardrails", v)}
          />
          <EscalationTriggersSection
            triggers={config.escalation_triggers}
            onChange={(v) => updateField("escalation_triggers", v)}
          />
          <ToolPolicySection
            policy={config.tool_policy}
            onChange={(v) => updateField("tool_policy", v)}
          />
          <ToneGuidelinesSection
            guidelines={config.tone_guidelines}
            onChange={(v) => updateField("tone_guidelines", v)}
          />
        </div>

        <div>
          <PromptPreviewPanel preview={preview} loading={previewLoading} />
        </div>
      </div>
    </div>
  );
}
