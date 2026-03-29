import type { ReactNode } from "react";
import { cn } from "../utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  action,
  className,
}: FormSectionProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card",
        className
      )}
    >
      <div className="flex items-start justify-between border-b border-border p-6">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
