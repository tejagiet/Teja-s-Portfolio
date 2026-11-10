import type { ReactNode } from "react";

import { Icon } from "@/components/ui/icon";

export function EmptyState({
  icon = "Inbox",
  title,
  description,
  action,
  compact = false,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 text-center ${
        compact ? "px-5 py-8" : "px-6 py-14"
      }`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon name={icon} className="h-4.5 w-4.5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
