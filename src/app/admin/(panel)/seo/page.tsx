import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Info,
  Plus,
  Search,
  TriangleAlert,
} from "lucide-react";

import { ActionForm } from "@/components/admin/action-form";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { EditorPanel } from "@/components/admin/collection";
import { ImageField } from "@/components/admin/image-field";
import { PageHeader } from "@/components/admin/page-header";
import { PageSpeedChecker } from "@/components/admin/page-speed-checker";
import { Panel } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { uploadMediaAction } from "@/lib/actions/media";
import { deleteRedirectAction, runPageSpeedAction, saveRedirectAction, saveSeoPageAction } from "@/lib/actions/seo";
import { SEO_PAGES } from "@/lib/constants";
import { db } from "@/lib/db";
import { runSeoAudit } from "@/lib/seo-audit";
import { getSiteSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "SEO manager" };

export const dynamic = "force-dynamic";

export default async function SeoManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const tab =
    params.tab === "redirects" || params.tab === "audit"
      ? params.tab
      : params.redirect
        ? "redirects"
        : "metadata";

  const [seoEntries, redirects, settings, audit] = await Promise.all([
    db.seoMetadata.findMany(),
    db.redirect.findMany({ orderBy: { source: "asc" } }),
    getSiteSettings(),
    tab === "audit" ? runSeoAudit() : Promise.resolve(null),
  ]);

  const byKey = new Map(seoEntries.map((entry) => [entry.pageKey, entry]));
  const selectedPage =
    SEO_PAGES.find((page) => page.key === params.page) || SEO_PAGES[0];
  const selectedSeo = byKey.get(selectedPage.key);

  const editingRedirect =
    params.redirect && params.redirect !== "new"
      ? redirects.find((redirect) => redirect.id === params.redirect) || null
      : null;

  const image =
    selectedSeo?.ogImageUrl ||
    settings.defaultSocialImage ||
    `/api/og?title=${encodeURIComponent(selectedSeo?.title || selectedPage.label)}`;
  const canonical =
    selectedSeo?.canonicalUrl || `${settings.siteUrl.replace(/\/$/, "")}${selectedPage.path}`;

  return (
    <div>
      <PageHeader
        eyebrow="Publishing"
        title="SEO manager"
        description="Control page metadata, social sharing, redirects and technical health. Canonical URLs, Open Graph tags and JSON-LD are generated from these values."
        actions={
          <>
            <Link
              href="/sitemap.xml"
              target="_blank"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Sitemap
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/robots.txt"
              target="_blank"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Robots
              <ExternalLink className="h-3 w-3" />
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[
          { value: "metadata", label: "Page metadata", href: "/admin/seo" },
          { value: "redirects", label: "Redirects", href: "/admin/seo?tab=redirects" },
          { value: "audit", label: "Audit & performance", href: "/admin/seo?tab=audit" },
        ].map((entry) => (
          <Link
            key={entry.value}
            href={entry.href}
            className={`inline-flex h-8 items-center rounded-lg border px-3 text-[11px] font-medium transition-colors ${
              tab === entry.value
                ? "border-accent/30 bg-accent-soft text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {entry.label}
          </Link>
        ))}
      </div>

      {tab === "metadata" ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="space-y-4">
            <Panel
              title="Managed pages"
              description="Each page has its own title, description, keywords, social image and indexing policy."
            >
              <ul className="divide-y divide-border">
                {SEO_PAGES.map((page) => {
                  const seo = byKey.get(page.key);
                  const active = page.key === selectedPage.key;
                  return (
                    <li key={page.key}>
                      <Link
                        href={`/admin/seo?page=${page.key}`}
                        className={`flex items-start gap-3 px-1 py-3 transition-colors ${
                          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            active ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Search className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                            {page.label}
                            <span className="font-mono text-[9px] font-normal text-muted-foreground">{page.path}</span>
                            {seo?.noIndex ? <Badge tone="warning">No index</Badge> : null}
                            {!seo ? <Badge tone="danger">Missing</Badge> : null}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {seo?.title || "No managed title yet"}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground/80">
                            {seo?.description || "No managed description yet"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right text-[9px] text-muted-foreground">
                          <p>{seo ? `${seo.title.length} / 60` : "—"}</p>
                          <p>{seo ? `${seo.description.length} / 160` : "—"}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Search result preview" description="Approximate Google desktop appearance.">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[8px] font-bold">
                      TM
                    </span>
                    {settings.siteUrl.replace(/^https?:\/\//, "")}
                    <span className="truncate">{selectedPage.path}</span>
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[15px] leading-snug text-[#1a0dab] dark:text-blue-400">
                    {selectedSeo?.title || `${selectedPage.label} — ${settings.siteName}`}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                    {selectedSeo?.description ||
                      "Add a managed description so search results explain this page accurately."}
                  </p>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                  Titles over 60 characters and descriptions outside 50–160 characters may be truncated.
                </p>
              </Panel>

              <Panel title="Social card preview" description="Open Graph and Twitter card image fallback order.">
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="relative aspect-[1200/630] bg-muted">
                    <Image
                      src={image}
                      alt={`Social preview for ${selectedPage.label}`}
                      fill
                      sizes="480px"
                      className="object-cover"
                      unoptimized={image.startsWith("/api/og")}
                    />
                  </div>
                  <div className="border-t border-border p-2.5">
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                      {settings.siteUrl.replace(/^https?:\/\//, "")}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] font-medium">
                      {selectedSeo?.title || `${selectedPage.label} — ${settings.siteName}`}
                    </p>
                    <p className="line-clamp-2 text-[10px] text-muted-foreground">
                      {selectedSeo?.description || settings.siteDescription}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                  {selectedSeo?.ogImageUrl
                    ? "Using the page-specific social image."
                    : settings.defaultSocialImage
                      ? "Using the site-wide default social image."
                      : "Using the dynamically generated Open Graph image."}
                </p>
              </Panel>
            </div>

            <Panel title="Canonical and indexing" description="Values emitted in the page head.">
              <dl className="grid gap-2 text-[11px] sm:grid-cols-2">
                <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                  <dt className="text-[9px] uppercase tracking-wide text-muted-foreground">Canonical URL</dt>
                  <dd className="mt-0.5 break-all font-medium">{canonical}</dd>
                </div>
                <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                  <dt className="text-[9px] uppercase tracking-wide text-muted-foreground">Robots</dt>
                  <dd className="mt-0.5 font-medium">
                    {selectedSeo?.noIndex ? "noindex, nofollow" : "index, follow"}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Structured data (Person, ProfilePage, WebSite, CreativeWork and BreadcrumbList) is emitted
                automatically. Project pages use their own descriptions and covers as metadata.
              </p>
            </Panel>
          </div>

          <div className="xl:sticky xl:top-20">
            <EditorPanel
              title={`${selectedPage.label} metadata`}
              description={selectedSeo ? "Saved values override the built-in fallbacks." : "No managed metadata yet. Saving creates it."}
              closeHref="/admin/seo"
              tone="accent"
            >
              <ActionForm action={saveSeoPageAction} submitLabel="Save metadata">
                <input type="hidden" name="pageKey" value={selectedPage.key} />
                <div className="space-y-3">
                  <Field
                    label={`Title · ${selectedSeo?.title.length ?? 0}/60`}
                    htmlFor="seo-title"
                    hint="Keep it under 60 characters where possible."
                  >
                    <Input
                      id="seo-title"
                      name="title"
                      defaultValue={selectedSeo?.title || `${selectedPage.label} — ${settings.siteName}`}
                      required
                      maxLength={120}
                    />
                  </Field>
                  <Field
                    label={`Description · ${selectedSeo?.description.length ?? 0}/160`}
                    htmlFor="seo-description"
                    hint="Aim for 50–160 characters. This text appears in search results and social cards."
                  >
                    <Textarea
                      id="seo-description"
                      name="description"
                      defaultValue={selectedSeo?.description || ""}
                      required
                      minLength={20}
                      maxLength={400}
                      className="min-h-24"
                    />
                  </Field>
                  <Field label="Keywords" htmlFor="seo-keywords" hint="One per line or comma separated. Optional.">
                    <Textarea
                      id="seo-keywords"
                      name="keywords"
                      defaultValue={selectedSeo?.keywords.join("\n") || ""}
                      maxLength={800}
                      className="min-h-20"
                    />
                  </Field>
                  <ImageField
                    name="ogImageUrl"
                    label="Social image"
                    value={selectedSeo?.ogImageUrl}
                    uploadAction={uploadMediaAction}
                    folder="social"
                    aspect={1200 / 630}
                    hint="Optional. Falls back to the site-wide social image."
                  />
                  <Field
                    label="Canonical URL"
                    htmlFor="seo-canonical"
                    hint="Optional. Leave blank to use the site URL plus this page path."
                  >
                    <Input
                      id="seo-canonical"
                      name="canonicalUrl"
                      type="url"
                      defaultValue={selectedSeo?.canonicalUrl || ""}
                      maxLength={600}
                      placeholder={`${settings.siteUrl}${selectedPage.path}`}
                    />
                  </Field>
                  <Checkbox
                    name="noIndex"
                    label="Exclude from search engines"
                    description="Adds noindex, nofollow. Use only for pages that should not appear in search."
                    defaultChecked={selectedSeo?.noIndex ?? false}
                  />
                </div>
              </ActionForm>
            </EditorPanel>
          </div>
        </div>
      ) : null}

      {tab === "redirects" ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            <Panel
              title="Managed redirects"
              description="Resolved by the catch-all route when no real page matches. Changes take effect immediately."
              action={
                <Link
                  href="/admin/seo?tab=redirects&redirect=new"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-2.5 text-[11px] font-medium text-accent-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add redirect
                </Link>
              }
            >
              {redirects.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse">
                    <thead>
                      <tr>
                        <th className="border-b border-border py-2 pr-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Source
                        </th>
                        <th className="border-b border-border px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Destination
                        </th>
                        <th className="border-b border-border px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Type
                        </th>
                        <th className="border-b border-border px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Hits
                        </th>
                        <th className="border-b border-border pl-3 py-2 text-right text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {redirects.map((redirect) => (
                        <tr key={redirect.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                          <td className="py-3 pr-3 font-mono text-[10px]">{redirect.source}</td>
                          <td className="max-w-[18rem] truncate px-3 py-3 text-[11px] text-muted-foreground">
                            {redirect.destination}
                          </td>
                          <td className="px-3 py-3">
                            <Badge tone={redirect.permanent ? "accent" : "neutral"}>
                              {redirect.permanent ? "301" : "302"}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-[11px] tabular-nums text-muted-foreground">
                            {redirect.hits}
                          </td>
                          <td className="py-3 pl-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/admin/seo?tab=redirects&redirect=${redirect.id}`}
                                className="inline-flex h-7 items-center rounded-lg border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                              >
                                Edit
                              </Link>
                              <ConfirmDelete
                                id={redirect.id}
                                name={redirect.source}
                                action={deleteRedirectAction}
                                size="icon"
                                redirectTo="/admin/seo?tab=redirects"
                                description="The redirect is removed. The old path will show a 404 unless another rule matches."
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon="ArrowRightLeft"
                  title="No redirects"
                  description="Add a redirect when a public URL changes so old links keep working."
                  action={
                    <Link
                      href="/admin/seo?tab=redirects&redirect=new"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add redirect
                    </Link>
                  }
                />
              )}
            </Panel>

            <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
              <p className="text-xs font-semibold text-foreground">How redirects work</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-4">
                <li>Only unmatched paths are checked. Real pages always win.</li>
                <li>301 is permanent and preferred for content that has moved.</li>
                <li>302 is temporary and should be used sparingly.</li>
                <li>Hits are recorded each time a redirect is followed.</li>
              </ul>
            </div>
          </div>

          <div className="xl:sticky xl:top-20">
            {params.redirect ? (
              <EditorPanel
                title={editingRedirect ? "Edit redirect" : "Add redirect"}
                description="Use a root-relative source path and either a path or full URL as the destination."
                closeHref="/admin/seo?tab=redirects"
                tone="accent"
              >
                <ActionForm
                  action={saveRedirectAction}
                  submitLabel={editingRedirect ? "Save redirect" : "Create redirect"}
                  footerClassName="mt-4 flex items-center justify-end border-t border-border pt-4"
                >
                  {editingRedirect ? <input type="hidden" name="id" value={editingRedirect.id} /> : null}
                  <div className="space-y-3">
                    <Field label="Source path" htmlFor="redirect-source" hint="Example: /old-projects">
                      <Input
                        id="redirect-source"
                        name="source"
                        defaultValue={editingRedirect?.source || ""}
                        required
                        maxLength={300}
                        placeholder="/old-path"
                      />
                    </Field>
                    <Field
                      label="Destination"
                      htmlFor="redirect-destination"
                      hint="A path such as /projects or a full https:// URL."
                    >
                      <Input
                        id="redirect-destination"
                        name="destination"
                        defaultValue={editingRedirect?.destination || ""}
                        required
                        maxLength={600}
                        placeholder="/projects"
                      />
                    </Field>
                    <Checkbox
                      name="permanent"
                      label="Permanent redirect (301)"
                      description="Recommended when content has moved. Uncheck for a temporary 302."
                      defaultChecked={editingRedirect ? editingRedirect.permanent : true}
                    />
                    {editingRedirect ? (
                      <p className="text-[10px] text-muted-foreground">
                        {editingRedirect.hits} hit{editingRedirect.hits === 1 ? "" : "s"} · created{" "}
                        {formatDateTime(editingRedirect.createdAt)}
                      </p>
                    ) : null}
                  </div>
                </ActionForm>
              </EditorPanel>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
                <p className="text-xs font-semibold text-foreground">Example</p>
                <p className="mt-2 font-mono text-[10px]">/old-portfolio → /projects</p>
                <p className="mt-2">
                  When someone visits /old-portfolio, the catch-all route looks up the rule and redirects with the
                  configured status code.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tab === "audit" && audit ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">SEO score</p>
              <p
                className={`mt-1 text-3xl font-semibold tabular-nums ${
                  audit.score >= 85
                    ? "text-emerald-600 dark:text-emerald-400"
                    : audit.score >= 60
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {audit.score}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {audit.issues.length} open issue{audit.issues.length === 1 ? "" : "s"}
              </p>
            </div>
            {[
              { label: "Indexable pages", value: audit.stats.indexedPages, detail: `${audit.stats.pages} managed static pages` },
              { label: "Published projects", value: audit.stats.publishedProjects, detail: "Included in the sitemap" },
              {
                label: "Content warnings",
                value: audit.stats.missingAlt + audit.stats.brokenLinks,
                detail: `${audit.stats.missingAlt} missing alt · ${audit.stats.brokenLinks} broken links`,
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{stat.value}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{stat.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-4">
              <Panel
                title="Issues"
                description="Ordered by severity. Every issue links to the module where it can be fixed."
              >
                {audit.issues.length ? (
                  <ul className="space-y-2">
                    {audit.issues.map((issue) => (
                      <li
                        key={`${issue.code}-${issue.message}`}
                        className="flex items-start gap-2.5 rounded-xl border border-border p-2.5"
                      >
                        {issue.severity === "critical" ? (
                          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden />
                        ) : issue.severity === "warning" ? (
                          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
                        ) : (
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] leading-relaxed">{issue.message}</p>
                          {issue.href ? (
                            <Link href={issue.href} className="mt-0.5 inline-block text-[10px] font-medium text-accent hover:underline">
                              Fix this
                            </Link>
                          ) : null}
                        </div>
                        <Badge
                          tone={issue.severity === "critical" ? "danger" : issue.severity === "warning" ? "warning" : "neutral"}
                          className="ml-auto shrink-0"
                        >
                          {issue.severity}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    No issues detected. Keep metadata and content current as the portfolio grows.
                  </p>
                )}
              </Panel>

              <Panel
                title="Technical checks"
                description="Programmatic checks against the current configuration and content."
              >
                <ul className="grid gap-2 sm:grid-cols-2">
                  {audit.checks.map((check) => (
                    <li key={check.label} className="flex items-start gap-2 rounded-lg border border-border p-2.5">
                      {check.ok ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                      ) : (
                        <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium">{check.label}</p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{check.detail}</p>
                        {check.href ? (
                          <Link href={check.href} className="text-[9px] font-medium text-accent hover:underline">
                            Open
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            <div className="space-y-4 xl:sticky xl:top-20">
              <Panel
                title="PageSpeed Insights"
                description="Runs Google Lighthouse against the configured public URL and never stores the result."
              >
                <PageSpeedChecker action={runPageSpeedAction} />
              </Panel>

              <Panel title="Search engine setup" description="Verification and analytics are configured in website settings.">
                <ul className="space-y-2 text-[10px] leading-relaxed">
                  <li className="flex items-center justify-between gap-2">
                    <span>Google Analytics 4</span>
                    <Badge tone={settings.analyticsId ? "success" : "neutral"}>
                      {settings.analyticsId ? "Configured" : "Not set"}
                    </Badge>
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <span>Search Console</span>
                    <Badge tone={settings.googleVerification ? "success" : "neutral"}>
                      {settings.googleVerification ? "Verified" : "Not set"}
                    </Badge>
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <span>Bing Webmaster</span>
                    <Badge tone={settings.bingVerification ? "success" : "neutral"}>
                      {settings.bingVerification ? "Verified" : "Not set"}
                    </Badge>
                  </li>
                </ul>
                <Link
                  href="/admin/settings"
                  className="mt-3 inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Open website settings
                </Link>
              </Panel>

              <div className="rounded-2xl border border-border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
                <p className="text-xs font-semibold text-foreground">Generated endpoints</p>
                <ul className="mt-2 space-y-1.5">
                  <li>
                    <Link href="/sitemap.xml" target="_blank" className="font-medium text-accent hover:underline">
                      /sitemap.xml
                    </Link>{" "}
                    — {audit.stats.indexedPages} URLs
                  </li>
                  <li>
                    <Link href="/robots.txt" target="_blank" className="font-medium text-accent hover:underline">
                      /robots.txt
                    </Link>{" "}
                    — generated from settings
                  </li>
                  <li>
                    <Link href="/api/og" target="_blank" className="font-medium text-accent hover:underline">
                      /api/og
                    </Link>{" "}
                    — dynamic social image
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
