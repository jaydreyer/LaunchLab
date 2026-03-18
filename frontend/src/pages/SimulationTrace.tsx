import { PageHeader } from "@/components/layout/PageHeader";

export default function SimulationTrace() {
  return (
    <div>
      <PageHeader
        title="Simulation Trace"
        description="Inspect the full timeline of a completed simulation — messages, tool calls, and outcomes."
      />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Trace detail view coming soon.
      </div>
    </div>
  );
}
