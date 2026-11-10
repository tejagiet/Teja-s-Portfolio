import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  detail,
  icon,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: string;
  href?: string;
  tone?: "default" | "accent" | "warning" | "success";
}) {
  const tones = {
    default: "bg-muted text-muted-foreground",
    accent: "bg-accent-soft text-accent",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };

  const body = (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent/20">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", tones[tone])}>
          <Icon name={icon} className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-semibold tabular-nums tracking-[-0.03em]">{value}</p>
        {detail ? <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-xs font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
