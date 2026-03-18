import { PageHeader } from "@/components/layout/PageHeader";

export default function Simulator() {
  return (
    <div>
      <PageHeader
        title="Conversation Simulator"
        description="Run live conversations between the healthcare agent and simulated patients."
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground lg:col-span-3">
          Chat transcript coming soon.
        </div>
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground lg:col-span-2">
          Tool trace panel coming soon.
        </div>
      </div>
    </div>
  );
}
