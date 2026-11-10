import type { Metadata } from "next";
import Link from "next/link";
import { History, X } from "lucide-react";

import { ListToolbar, TableShell, Td, Th } from "@/components/admin/collection";
import { PageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { formatDateTime, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Activity logs" };

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const RANGES = [
  { value: "", label: "All time" },
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

function actionTone(action: string) {
  switch (action) {
    case "CREATE":
    case "UPLOAD":
      return "success" as const;
    case "DELETE":
      return "danger" as const;
    case "UNPUBLISH":
    case "ARCHIVE":
      return "warning" as const;
    default:
      return "accent" as const;
  }
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; entity?: string; range?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const action = params.action || "";
  const entity = params.entity || "";
  const range = params.range || "";
  const page = Math.max(1, Number(params.page) || 1);

  const since =
    range && !Number.isNaN(Number(range))
      ? new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000)
      : null;

  const where = {
    ...(action ? { action } : {}),
    ...(entity ? { entityType: entity } : {}),
    ...(since ? { createdAt: { gte: since } } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" as const } },
            { entityType: { contains: q, mode: "insensitive" as const } },
            { action: { contains: q, mode: "insensitive" as const } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [entries, total, actions, entities, totalAll, last24h] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.activityLog.count({ where }),
    db.activityLog.groupBy({
      by: ["action"],
      _count: { _all: true },
    }),
    db.activityLog.groupBy({
      by: ["entityType"],
      _count: { _all: true },
    }),
    db.activityLog.count(),
    db.activityLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(q || action || entity || range);
  actions.sort((a, b) => b._count._all - a._count._all);
  entities.sort((a, b) => b._count._all - a._count._all);
  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const values = { q, action, entity, range, page: String(page), ...overrides };
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, String(value));
    }
    const query = next.toString();
    return query ? `/admin/activity?${query}` : "/admin/activity";
  };

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Activity logs"
        description="An append-only record of administrative changes. Every create, update, delete, publish, upload and export performed in the CMS is recorded here."
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "All recorded events", value: totalAll },
          { label: "Last 24 hours", value: last24h },
          { label: "Matching filters", value: total },
          { label: "Action types", value: actions.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card px-3 py-2">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">
          <ListToolbar defaultValue={q} placeholder="Search description, action, entity or user…">
            <select
              name="action"
              defaultValue={action}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-[11px] text-foreground"
              aria-label="Filter by action"
            >
              <option value="">All actions</option>
              {actions.map((entry) => (
                <option key={entry.action} value={entry.action}>
                  {entry.action} ({entry._count._all})
                </option>
              ))}
            </select>
            <select
              name="entity"
              defaultValue={entity}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-[11px] text-foreground"
              aria-label="Filter by entity"
            >
              <option value="">All entities</option>
              {entities.map((entry) => (
                <option key={entry.entityType} value={entry.entityType}>
                  {entry.entityType} ({entry._count._all})
                </option>
              ))}
            </select>
            <select
              name="range"
              defaultValue={range}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-[11px] text-foreground"
              aria-label="Filter by date range"
            >
              {RANGES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
            {hasFilters ? (
              <Link
                href="/admin/activity"
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear
              </Link>
            ) : null}
          </ListToolbar>

          {entries.length ? (
            <>
              <TableShell>
                <table className="w-full min-w-[820px] border-collapse">
                  <thead>
                    <tr>
                      <Th>Time</Th>
                      <Th>Actor</Th>
                      <Th>Action</Th>
                      <Th>Entity</Th>
                      <Th>Description</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                        <Td className="whitespace-nowrap text-muted-foreground">
                          <p>{formatDateTime(entry.createdAt)}</p>
                          <p className="text-[9px] text-muted-foreground/80">{relativeTime(entry.createdAt)}</p>
                        </Td>
                        <Td>
                          <p className="font-medium">{entry.user?.name || "System"}</p>
                          <p className="text-[9px] text-muted-foreground">{entry.user?.email || "No actor"}</p>
                        </Td>
                        <Td>
                          <Badge tone={actionTone(entry.action)}>{entry.action}</Badge>
                        </Td>
                        <Td className="font-mono text-[10px] text-muted-foreground">{entry.entityType}</Td>
                        <Td>
                          <p className="max-w-[28rem] leading-relaxed">{entry.description}</p>
                          {entry.metadata && typeof entry.metadata === "object" ? (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-[9px] text-muted-foreground hover:text-foreground">
                                Metadata
                              </summary>
                              <pre className="mt-1 max-w-[28rem] overflow-x-auto rounded-lg bg-muted/60 p-2 text-[9px] leading-relaxed text-muted-foreground">
                                {JSON.stringify(entry.metadata, null, 2)}
                              </pre>
                            </details>
                          ) : null}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <p>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-1.5">
                  {page > 1 ? (
                    <Link
                      href={buildHref({ page: page - 1 })}
                      className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 hover:text-foreground"
                    >
                      Previous
                    </Link>
                  ) : null}
                  <span className="px-1 tabular-nums">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link
                      href={buildHref({ page: page + 1 })}
                      className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 hover:text-foreground"
                    >
                      Next
                    </Link>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon="History"
              title={hasFilters ? "No activity matches these filters" : "No activity recorded yet"}
              description={
                hasFilters
                  ? "Try clearing one or more filters or searching for a different term."
                  : "Changes made in the admin dashboard will appear here with the actor, action and affected entity."
              }
            />
          )}
        </div>

        <div className="space-y-4 xl:sticky xl:top-20">
          <Panel title="Top actions" description="Most frequent operations across the workspace.">
            {actions.length ? (
              <ul className="space-y-1.5">
                {actions.slice(0, 8).map((entry) => (
                  <li key={entry.action}>
                    <Link
                      href={buildHref({ action: entry.action, page: 1 })}
                      className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-[11px] transition-colors hover:bg-muted/50"
                    >
                      <span className="flex-1">{entry.action}</span>
                      <span className="tabular-nums text-muted-foreground">{entry._count._all}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-muted-foreground">No actions recorded.</p>
            )}
          </Panel>

          <Panel title="Entities" description="Types of records changed in the CMS.">
            {entities.length ? (
              <ul className="space-y-1.5">
                {entities.slice(0, 10).map((entry) => (
                  <li key={entry.entityType}>
                    <Link
                      href={buildHref({ entity: entry.entityType, page: 1 })}
                      className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-[11px] transition-colors hover:bg-muted/50"
                    >
                      <span className="flex-1 font-mono text-[10px]">{entry.entityType}</span>
                      <span className="tabular-nums text-muted-foreground">{entry._count._all}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-muted-foreground">No entities recorded.</p>
            )}
          </Panel>

          <div className="rounded-2xl border border-border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-accent" aria-hidden />
              <p className="text-xs font-semibold text-foreground">Audit integrity</p>
            </div>
            <p className="mt-2">
              Activity records are written by server actions and route handlers after the database change succeeds.
              Deleting a user detaches their logs rather than removing history. Logs are not editable from the
              dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
