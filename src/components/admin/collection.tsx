import Link from "next/link";
import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export function AdminCollection({
  children,
  editor,
  className,
}: {
  children: ReactNode;
  editor?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-start gap-5",
        editor ? "xl:grid-cols-[minmax(0,1fr)_25rem]" : "",
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      {editor ? <div className="xl:sticky xl:top-20">{editor}</div> : null}
    </div>
  );
}

export function EditorPanel({
  title,
  description,
  closeHref,
  children,
  tone = "default",
}: {
  title: string;
  description?: string;
  closeHref: string;
  children: ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-sm",
        tone === "accent" ? "border-accent/30" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-xs font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <Link
          href={closeHref}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close editor"
        >
          <X className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ListToolbar({
  defaultValue = "",
  placeholder = "Search…",
  children,
  hidden,
  className,
}: {
  defaultValue?: string;
  placeholder?: string;
  children?: ReactNode;
  hidden?: Array<{ name: string; value: string }>;
  className?: string;
}) {
  return (
    <form
      method="get"
      className={cn(
        "mb-4 flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      {hidden?.map((entry) => (
        <input key={entry.name} type="hidden" name={entry.name} value={entry.value} />
      ))}
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-9 pl-9 text-xs"
          aria-label={placeholder}
        />
      </div>
      {children}
      <button
        type="submit"
        className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        Filter
      </button>
    </form>
  );
}

export function TableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-border px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle text-xs", className)}>{children}</td>;
}
