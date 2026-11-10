import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  FileText,
  Mail,
  MessageSquare,
  Plus,
} from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Panel, StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { runSeoAudit } from "@/lib/seo-audit";
import { formatDateTime, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const user = await requireAdmin();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    profile,
    projectTotal,
    projectPublished,
    projectFeatured,
    unreadMessages,
    recentMessages,
    resumePublished,
    resumeDrafts,
    activity,
    skillCount,
    hiddenSkillCount,
    experienceTotal,
    experiencePublished,
    educationTotal,
    certificationTotal,
    serviceTotal,
    servicePublished,
    achievementTotal,
    mediaCount,
    analyticsViews,
    analyticsSessions,
    topPages,
    audit,
  ] = await Promise.all([
    db.profile.findFirst({
      select: {
        displayName: true,
        title: true,
        email: true,
        about: true,
        profilePhotoUrl: true,
        socialLinks: { where: { isVisible: true }, select: { id: true } },
      },
    }),
    db.project.count(),
    db.project.count({ where: { published: true } }),
    db.project.count({ where: { featured: true, published: true } }),
    db.contactMessage.count({ where: { status: "UNREAD" } }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    db.resumeVersion.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { id: true, version: true, title: true, outdated: true, publishedAt: true },
    }),
    db.resumeVersion.count({ where: { status: "DRAFT" } }),
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 7, include: { user: { select: { name: true } } } }),
    db.skill.count(),
    db.skill.count({ where: { isVisible: false } }),
    db.experience.count(),
    db.experience.count({ where: { published: true } }),
    db.education.count(),
    db.certification.count(),
    db.service.count(),
    db.service.count({ where: { published: true } }),
    db.achievement.count(),
    db.mediaAsset.count(),
    db.analyticsEvent.count({ where: { type: "PAGE_VIEW", createdAt: { gte: since } } }),
    db.analyticsEvent.findMany({
      where: { type: "PAGE_VIEW", createdAt: { gte: since }, sessionId: { not: null } },
      distinct: ["sessionId"],
      select: { sessionId: true },
    }),
    db.analyticsEvent.groupBy({
      by: ["path"],
      where: { type: "PAGE_VIEW", createdAt: { gte: since } },
      _count: { _all: true },
    }),
    runSeoAudit(),
  ]);

  const firstName = (profile?.displayName || user.name).split(" ")[0];
  const top = [...topPages]
    .map((entry) => ({ path: entry.path || "/", count: entry._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const checklist = [
    {
      label: "Profile introduction",
      detail: profile?.about?.trim()
        ? "A public introduction is published."
        : "Add an introduction to the profile.",
      done: Boolean(profile?.about?.trim()),
      href: "/admin/profile",
    },
    {
      label: "Profile photo",
      detail: profile?.profilePhotoUrl ? "A public portrait is available." : "Upload a public portrait.",
      done: Boolean(profile?.profilePhotoUrl),
      href: "/admin/profile",
    },
    {
      label: "Contact details",
      detail: profile?.email ? "A public email address is set." : "Add an email address so visitors can reach you.",
      done: Boolean(profile?.email),
      href: "/admin/profile",
    },
    {
      label: "Visible social link",
      detail: profile?.socialLinks.length
        ? `${profile.socialLinks.length} social link${profile.socialLinks.length === 1 ? "" : "s"} visible.`
        : "All social links are hidden or placeholders.",
      done: Boolean(profile?.socialLinks.length),
      href: "/admin/profile",
    },
    {
      label: "Skills",
      detail: `${skillCount} skill${skillCount === 1 ? "" : "s"} across ${
        hiddenSkillCount ? `${hiddenSkillCount} hidden` : "visible categories"
      }.`,
      done: skillCount > 0,
      href: "/admin/skills",
    },
    {
      label: "Published projects",
      detail: `${projectPublished} of ${projectTotal} project records are published.`,
      done: projectPublished > 0,
      href: "/admin/projects",
    },
    {
      label: "Experience",
      detail: experienceTotal
        ? `${experiencePublished} of ${experienceTotal} entries published.`
        : "No experience entries yet. Add only verified roles.",
      done: experiencePublished > 0,
      href: "/admin/experience",
    },
    {
      label: "Approved resume",
      detail: resumePublished
        ? resumePublished.outdated
          ? "The published resume is outdated. Review the generated draft."
          : `Version ${resumePublished.version} is approved and public.`
        : "No approved resume is available for download.",
      done: Boolean(resumePublished) && !resumePublished?.outdated,
      href: "/admin/resume",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="A real-time view of the public portfolio, the publishing queue and technical health. Everything here is editable without a redeploy."
        actions={
          <>
            <Link
              href="/"
              target="_blank"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View public site
              <ArrowUpRight className="h-3 w-3" />
            </Link>
            <Link
              href="/admin/projects/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground transition-all hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" />
              New project
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Published projects"
          value={projectPublished}
          detail={`${projectTotal} total · ${projectFeatured} featured`}
          icon="FolderKanban"
          href="/admin/projects"
          tone="accent"
        />
        <StatCard
          label="Unread messages"
          value={unreadMessages}
          detail={unreadMessages ? "Waiting for a reply" : "Inbox is clear"}
          icon="Mail"
          href="/admin/messages"
          tone={unreadMessages ? "warning" : "default"}
        />
        <StatCard
          label="Resume"
          value={resumePublished ? `v${resumePublished.version}` : "—"}
          detail={
            resumePublished
              ? resumePublished.outdated
                ? "Published · outdated"
                : "Approved · current"
              : "Nothing approved yet"
          }
          icon="FileText"
          href="/admin/resume"
          tone={resumePublished && !resumePublished.outdated ? "success" : "warning"}
        />
        <StatCard
          label="SEO health"
          value={audit.score}
          detail={`${audit.issues.length} open issue${audit.issues.length === 1 ? "" : "s"}`}
          icon="Search"
          href="/admin/seo?tab=audit"
          tone={audit.score >= 85 ? "success" : audit.score >= 60 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel
            title="Traffic, last 7 days"
            description="First-party page views collected by the portfolio itself. Google Analytics is configured separately."
            action={
              <Link href="/admin/analytics" className="text-[10px] font-medium text-accent hover:underline">
                Open analytics
              </Link>
            }
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Page views</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{analyticsViews}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Sessions</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{analyticsSessions.length}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Top page</p>
                <p className="mt-1 truncate text-xs font-medium">{top[0]?.path || "No views yet"}</p>
              </div>
            </div>
            {top.length ? (
              <ul className="mt-3 space-y-1.5">
                {top.map((entry) => (
                  <li key={entry.path} className="flex items-center gap-2 text-[11px]">
                    <span className="w-32 truncate text-muted-foreground">{entry.path}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${Math.max(6, (entry.count / Math.max(1, top[0].count)) * 100)}%` }}
                      />
                    </span>
                    <span className="w-8 text-right tabular-nums">{entry.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                No page views have been recorded in this window. The tracker is active on the public site; visit a
                page and it will appear here.
              </p>
            )}
          </Panel>

          <Panel
            title="Publishing checklist"
            description="A practical, honest readiness check. Empty areas are marked as not added rather than invented."
          >
            <ul className="grid gap-2 sm:grid-cols-2">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-start gap-2 rounded-lg border border-border p-2.5">
                  {item.done ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                  ) : (
                    <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <Link href={item.href} className="text-[11px] font-medium hover:text-accent">
                      {item.label}
                    </Link>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Recent activity"
            description="Changes recorded by the CMS audit log."
            action={
              <Link href="/admin/activity" className="text-[10px] font-medium text-accent hover:underline">
                View all
              </Link>
            }
          >
            {activity.length ? (
              <ul className="space-y-2.5">
                {activity.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon name="History" className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] leading-snug">{entry.description}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {entry.user?.name || "System"} · {relativeTime(entry.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-muted-foreground">No activity has been recorded yet.</p>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            title="Resume status"
            description="The public download always serves the latest approved version."
            action={
              <Link href="/admin/resume" className="text-[10px] font-medium text-accent hover:underline">
                Open builder
              </Link>
            }
          >
            {resumePublished ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{resumePublished.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Version {resumePublished.version} ·{" "}
                      {resumePublished.publishedAt ? formatDateTime(resumePublished.publishedAt) : "Not published"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={resumePublished.outdated ? "warning" : "success"}>
                    {resumePublished.outdated ? "Outdated" : "Approved"}
                  </Badge>
                  <Badge tone="neutral">{resumeDrafts} draft{resumeDrafts === 1 ? "" : "s"}</Badge>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/api/admin/resume/${resumePublished.id}/pdf`}
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <Icon name="Download" className="h-3 w-3" />
                    Download PDF
                  </Link>
                  <Link
                    href="/resume"
                    target="_blank"
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <Icon name="Globe" className="h-3 w-3" />
                    Public page
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-3 text-center">
                <FileText className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-[11px] font-medium">No approved resume yet</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                  Generate a draft from the current profile, review it and approve it for the public download.
                </p>
                <Link
                  href="/admin/resume"
                  className="mt-2 inline-flex h-7 items-center rounded-lg bg-accent px-2.5 text-[10px] font-medium text-accent-foreground"
                >
                  Open resume builder
                </Link>
              </div>
            )}
          </Panel>

          <Panel
            title="SEO issues"
            description={`Score ${audit.score}/100 from ${audit.stats.indexedPages} indexable pages.`}
            action={
              <Link href="/admin/seo?tab=audit" className="text-[10px] font-medium text-accent hover:underline">
                Full audit
              </Link>
            }
          >
            {audit.issues.length ? (
              <ul className="space-y-2">
                {audit.issues.slice(0, 4).map((issue) => (
                  <li key={issue.code + issue.message} className="flex items-start gap-2">
                    {issue.severity === "critical" ? (
                      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden />
                    ) : (
                      <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] leading-relaxed">{issue.message}</p>
                      {issue.href ? (
                        <Link href={issue.href} className="text-[9px] font-medium text-accent hover:underline">
                          Fix this
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                No SEO issues detected.
              </p>
            )}
          </Panel>

          <Panel
            title="Latest messages"
            description="Contact submissions stored in the database."
            action={
              <Link href="/admin/messages" className="text-[10px] font-medium text-accent hover:underline">
                Open inbox
              </Link>
            }
          >
            {recentMessages.length ? (
              <ul className="space-y-2.5">
                {recentMessages.map((message) => (
                  <li key={message.id}>
                    <Link
                      href={`/admin/messages?message=${message.id}`}
                      className="flex items-start gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-muted/60"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        {message.status === "UNREAD" ? (
                          <Mail className="h-3 w-3" />
                        ) : (
                          <MessageSquare className="h-3 w-3" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium">{message.subject}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {message.name} · {relativeTime(message.createdAt)}
                        </p>
                      </div>
                      {message.status === "UNREAD" ? (
                        <span className="ml-auto mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-muted-foreground">No messages yet.</p>
            )}
          </Panel>

          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/admin/profile", label: "Edit profile", icon: "CircleUser" },
              { href: "/admin/resume", label: "Build resume", icon: "FileText" },
              { href: "/admin/seo", label: "SEO manager", icon: "Search" },
              { href: "/admin/media", label: "Media library", icon: "Images" },
              { href: "/admin/education", label: "Education", icon: "GraduationCap" },
              { href: "/admin/settings", label: "Settings", icon: "Settings" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-[11px] font-medium transition-colors hover:border-accent/30 hover:bg-muted/40"
              >
                <Icon name={action.icon} className="h-3.5 w-3.5 text-accent" />
                {action.label}
              </Link>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-3 text-[10px] leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Workspace totals</p>
            <p className="mt-1">
              {experienceTotal} experience · {educationTotal} education · {certificationTotal} certifications ·{" "}
              {serviceTotal} services ({servicePublished} published) · {achievementTotal} achievements ·{" "}
              {mediaCount} media assets
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
