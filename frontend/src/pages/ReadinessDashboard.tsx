import { PageHeader } from "@/components/layout/PageHeader";

export default function ReadinessDashboard() {
  return (
    <div>
      <PageHeader
        title="Launch Readiness"
        description="Overall readiness score, category breakdowns, failure themes, and exportable launch reports."
      />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Readiness dashboard coming soon.
      </div>
    </div>
  );
}
