import { PageHeader } from "@/components/layout/PageHeader";

export default function PracticeSetup() {
  return (
    <div>
      <PageHeader
        title="Practice Setup"
        description="Configure the healthcare practice profile — locations, providers, hours, insurance rules, and escalation policies."
      />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Practice configuration forms coming soon.
      </div>
    </div>
  );
}
