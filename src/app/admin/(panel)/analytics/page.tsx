import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Monitor, Smartphone } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Panel, StatCard } from "@/components/admin/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSiteSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

export const dynamic = "force-dynamic";

const RANGES = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = RANGES.some((entry) => String(entry.value) === params.range) ? Number(params.range) : 30;
  const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

  const [events, settings] = await Promise.all([
    db.analyticsEvent.findMany({
      where: { type: "PAGE_VIEW", createdAt: { gte: since } },
      select: { path: true, referrer: true, sessionId: true, device: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    getSiteSettings(),
  ]);

  const sessions = new Set(events.map((event) => event.sessionId).filter(Boolean));
  const mobile = events.filter((event) => event.device === "mobile").length;
  const mobileShare = events.length ? Math.round((mobile / events.length) * 100) : 0;

  const pageCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();

  for (const event of events) {
    const path = event.path || "/";
    pageCounts.set(path, (pageCounts.get(path) ?? 0) + 1);
    const referrer = event.referrer || "Direct / none";
    referrerCounts.set(referrer, (referrerCounts.get(referrer) ?? 0) + 1);
    const key = dayKey(event.createdAt);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }

  const topPages = [...pageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topReferrers = [...referrerCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const days = Array.from({ length: range }, (_, index) => {
    const date = new Date(since.getTime() + index * 24 * 60 * 60 * 1000);
    const key = dayKey(date);
    return { key, label: key.slice(5), count: dayCounts.get(key) ?? 0 };
  });
  const maxDay = Math.max(1, ...days.map((day) => day.count));

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Analytics"
        description="First-party, privacy-conscious page views collected by this portfolio. Nothing is estimated or simulated."
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
            {RANGES.map((entry) => (
              <Link
                key={entry.value}
                href={`/admin/analytics?range=${entry.value}`}
                className={cn(
                  "inline-flex h-7 items-center rounded-md px-2.5 text-[10px] font-medium transition-colors",
                  range === entry.value
                    ? "bg-accent-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {entry.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Page views" value={events.length} detail={`Last ${range} days`} icon="Eye" tone="accent" />
        <StatCard label="Sessions" value={sessions.size} detail="Distinct first-party sessions" icon="User" />
        <StatCard label="Mobile share" value={`${mobileShare}%`} detail={`${mobile} of ${events.length} views`} icon="Smartphone" />
        <StatCard
          label="Top page"
          value={topPages[0]?.[1] ?? 0}
          detail={topPages[0]?.[0] || "No page views yet"}
          icon="Globe"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel
          title={`Daily page views · last ${range} days`}
          description="UTC days. Hover a bar to see the exact date and count."
        >
          {events.length ? (
            <div>
              <div className="flex h-40 items-end gap-[3px]" role="img" aria-label="Daily page views bar chart">
                {days.map((day) => (
                  <div key={day.key} className="group flex h-full flex-1 flex-col justify-end">
                    <div
                      className="w-full rounded-t-sm bg-accent/70 transition-colors group-hover:bg-accent"
                      style={{ height: `${Math.max(2, (day.count / maxDay) * 100)}%` }}
                      title={`${day.key}: ${day.count} view${day.count === 1 ? "" : "s"}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-muted-foreground">
                <span>{days[0]?.key}</span>
                <span>{days[Math.floor(days.length / 2)]?.key}</span>
                <span>{days[days.length - 1]?.key}</span>
              </div>
            </div>
          ) : (
            <EmptyState
              compact
              icon="BarChart3"
              title="No page views in this range"
              description="The first-party tracker is active on public pages. Visit the site and refresh this page to see real data."
            />
          )}
        </Panel>

        <Panel title="Top pages" description="Most-viewed public paths in this range.">
          {topPages.length ? (
            <ul className="space-y-2">
              {topPages.map(([path, count]) => (
                <li key={path} className="flex items-center gap-2 text-[11px]">
                  <span className="w-28 truncate text-muted-foreground">{path}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(5, (count / topPages[0][1]) * 100)}%` }}
                    />
                  </span>
                  <span className="w-9 text-right tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-muted-foreground">No page views yet.</p>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Referrers" description="Where sessions arrived from, when the browser shared it.">
          {topReferrers.length ? (
            <ul className="space-y-1.5">
              {topReferrers.map(([referrer, count]) => (
                <li key={referrer} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="truncate text-muted-foreground">{referrer}</span>
                  <span className="tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-muted-foreground">No referrer data yet.</p>
          )}
        </Panel>

        <Panel title="Devices" description="Desktop versus mobile, based on the user agent.">
          {events.length ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-[11px]">
                <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                Desktop
                <span className="ml-auto tabular-nums">{events.length - mobile}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-[11px]">
                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                Mobile
                <span className="ml-auto tabular-nums">{mobile}</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">No device data yet.</p>
          )}
        </Panel>

        <Panel title="Google Analytics 4" description="Optional external analytics configuration.">
          <div className="flex items-start gap-2.5">
            <BarChart3 className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="text-[11px] leading-relaxed">
              {settings.analyticsId ? (
                <p>
                  GA4 measurement ID <span className="font-mono text-[10px]">{settings.analyticsId}</span> is configured
                  and loaded on the public site.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  No GA4 measurement ID is configured. Add one in website settings if you want Google Analytics in
                  addition to first-party analytics.
                </p>
              )}
              <Link href="/admin/settings" className="mt-2 inline-block font-medium text-accent hover:underline">
                Open settings
              </Link>
            </div>
          </div>
        </Panel>
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
        A page-view event is recorded without cookies for tracking; a first-party session identifier is stored to
        count sessions. Bots and admin pages are excluded. IP addresses are hashed only for rate limiting and are not
        stored with analytics events.
      </p>
    </div>
  );
}
