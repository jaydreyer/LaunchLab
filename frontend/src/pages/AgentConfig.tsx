import { PageHeader } from "@/components/layout/PageHeader";

export default function AgentConfig() {
  return (
    <div>
      <PageHeader
        title="Agent Config"
        description="Customize the healthcare agent's system prompt, workflow steps, guardrails, and tool policies."
      />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Agent configuration editor coming soon.
      </div>
    </div>
  );
}
