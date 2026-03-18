import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface PromptPreviewPanelProps {
  preview: string;
  loading: boolean;
}

export function PromptPreviewPanel({
  preview,
  loading,
}: PromptPreviewPanelProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Assembled System Prompt</CardTitle>
        <p className="text-xs text-muted-foreground">
          This is what Claude receives as its system prompt at runtime.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : preview ? (
          <pre className="max-h-[calc(100vh-14rem)] overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-xs font-mono leading-relaxed">
            {preview}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Save changes to see the assembled prompt preview.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
