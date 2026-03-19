import { AlertTriangle } from "lucide-react";
import type { EscalationOut } from "@/api/simulations";

interface EscalationBannerProps {
  escalation: EscalationOut;
}

export function EscalationBanner({ escalation }: EscalationBannerProps) {
  return (
    <div className="mx-2 flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div>
        <p className="font-medium text-destructive">Escalation Triggered</p>
        <p className="text-muted-foreground">
          <span className="font-medium">Type:</span> {escalation.type}
          {" — "}
          <span className="font-medium">Keyword:</span> "{escalation.keyword}"
        </p>
        <p className="text-muted-foreground">
          <span className="font-medium">Action:</span> {escalation.action}
        </p>
      </div>
    </div>
  );
}
