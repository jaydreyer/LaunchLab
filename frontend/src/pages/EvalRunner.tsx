import { PageHeader } from "@/components/layout/PageHeader";

export default function EvalRunner() {
  return (
    <div>
      <PageHeader
        title="Eval Runner"
        description="Run the evaluation suite against the current agent configuration and review results."
      />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Evaluation runner and results table coming soon.
      </div>
    </div>
  );
}
