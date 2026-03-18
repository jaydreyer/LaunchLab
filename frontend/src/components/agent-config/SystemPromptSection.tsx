import { SectionCard } from "@/components/practice/SectionCard";
import { Textarea } from "@/components/ui/textarea";

interface SystemPromptSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function SystemPromptSection({
  value,
  onChange,
}: SystemPromptSectionProps) {
  return (
    <SectionCard title="System Prompt">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="font-mono text-sm"
        placeholder="Define the agent's core role and behavior..."
      />
    </SectionCard>
  );
}
