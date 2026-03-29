import { CheckCircle2 } from "lucide-react";

export function EmptyEscalationState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-green-500/10 p-4 mb-4">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">All clear!</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        No conversations need human attention right now. The AI is handling everything.
      </p>
    </div>
  );
}
