import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleAlert, ExternalLink, ShieldCheck } from "lucide-react";

import { ActionForm } from "@/components/admin/action-form";
import { ImageField } from "@/components/admin/image-field";
import { PageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/card";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { updateSettingsAction } from "@/lib/actions/settings";
import { uploadMediaAction } from "@/lib/actions/media";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { verifyDatabaseHealth } from "@/lib/neon";
import { getSiteSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Website settings" };

export const dynamic = "force-dynamic";

function status(ok: boolean, label: string, detail: string) {
  return { ok, label, detail };
}

export default async function SettingsPage() {
  const [settings, dbHealth] = await Promise.all([
    getSiteSettings(),
    verifyDatabaseHealth(),
  ]);

  const https = /^https:\/\//.test(settings.siteUrl);
  const localUrl = /localhost|127\.0\.0\.1|\.local/i.test(settings.siteUrl);
  const isCld = isCloudinaryConfigured();

  const environment = [
    status(
      dbHealth.ok,
      dbHealth.isNeon ? "Neon PostgreSQL" : "PostgreSQL Database",
      dbHealth.ok
        ? `${dbHealth.message} ${dbHealth.isPooled ? "(Pooled)" : "(Direct)"}`
        : "DATABASE_URL is not connected.",
    ),
    status(
      dbHealth.hasDirectUrl,
      "Direct Migration URL",
      dbHealth.hasDirectUrl
        ? "DIRECT_URL is configured for Prisma migrations."
        : "DIRECT_URL not set (recommended for Neon DDL migrations).",
    ),
    status(Boolean(process.env.AUTH_SECRET), "Auth secret", "AUTH_SECRET is configured."),
    status(
      isCld,
      "Cloudinary Media",
      isCld
        ? `Cloudinary active (Cloud: ${process.env.CLOUDINARY_CLOUD_NAME || "configured"}, Folder: ${process.env.CLOUDINARY_FOLDER || "teja-portfolio"}).`
        : "Development mode: local filesystem fallback active (.data/uploads).",
    ),
    status(Boolean(process.env.RESEND_API_KEY), "Email notifications", "RESEND_API_KEY is configured."),
    status(Boolean(process.env.PAGESPEED_API_KEY), "PageSpeed API key", "Optional. Raises the PageSpeed Insights quota."),
    status(Boolean(process.env.IP_HASH_SALT), "Rate-limit salt", "IP_HASH_SALT is configured."),
  ];

  const configuredCount = environment.filter((entry) => entry.ok).length;

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Website settings"
        description="Global site configuration used by the public site, metadata, sitemap, robots file and contact form. These values are stored in the database and can be changed without a redeploy."
        actions={
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Open public site
            <ExternalLink className="h-3 w-3" />
          </Link>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          {!https ? (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <div>
                <p className="text-xs font-semibold text-foreground">Canonical URLs are not HTTPS</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {localUrl
                    ? "This is expected in local development. Set the production site URL before launch so canonical URLs, Open Graph tags and the sitemap use the real domain."
                    : "Search engines prefer HTTPS. Update the site URL to an https:// address before launch."}
                </p>
              </div>
            </div>
          ) : null}

          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold tracking-tight">Site identity</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Used for default metadata, the footer, the manifest and structured data.
              </p>
            </div>
            <div className="p-5">
              <ActionForm action={updateSettingsAction} submitLabel="Save settings">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Site name" htmlFor="siteName">
                    <Input id="siteName" name="siteName" defaultValue={settings.siteName} required maxLength={100} />
                  </Field>
                  <Field
                    label="Canonical site URL"
                    htmlFor="siteUrl"
                    hint="Include https:// and no trailing slash."
                  >
                    <Input
                      id="siteUrl"
                      name="siteUrl"
                      type="url"
                      defaultValue={settings.siteUrl}
                      required
                      maxLength={300}
                      placeholder="https://your-domain.com"
                    />
                  </Field>
                  <Field
                    label="Site description"
                    htmlFor="siteDescription"
                    hint="A concise description of the portfolio for search results."
                    className="sm:col-span-2"
                  >
                    <Textarea
                      id="siteDescription"
                      name="siteDescription"
                      defaultValue={settings.siteDescription}
                      required
                      minLength={20}
                      maxLength={500}
                      className="min-h-24"
                    />
                  </Field>
                  <Field label="Contact email" htmlFor="contactEmail" hint="Fallback recipient shown in the footer.">
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      defaultValue={settings.contactEmail || ""}
                      maxLength={200}
                    />
                  </Field>
                  <Field label="Availability note" htmlFor="availabilityNote" hint="Optional short status shown publicly.">
                    <Input
                      id="availabilityNote"
                      name="availabilityNote"
                      defaultValue={settings.availabilityNote || ""}
                      maxLength={200}
                      placeholder="Open to internship opportunities"
                    />
                  </Field>
                  <Field
                    label="Footer note"
                    htmlFor="footerNote"
                    hint="Optional line of text in the site footer."
                    className="sm:col-span-2"
                  >
                    <Textarea
                      id="footerNote"
                      name="footerNote"
                      defaultValue={settings.footerNote || ""}
                      maxLength={300}
                      className="min-h-20"
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <ImageField
                      name="defaultSocialImage"
                      label="Default social sharing image"
                      value={settings.defaultSocialImage}
                      uploadAction={uploadMediaAction}
                      folder="social"
                      aspect={1200 / 630}
                      hint="Used for Open Graph and Twitter cards when a page has no dedicated image. 1200×630 is recommended."
                    />
                  </div>

                  <Field
                    label="Google Analytics 4 measurement ID"
                    htmlFor="analyticsId"
                    hint="Example: G-XXXXXXXXXX. Leave blank to disable GA4. First-party analytics still records page views."
                  >
                    <Input
                      id="analyticsId"
                      name="analyticsId"
                      defaultValue={settings.analyticsId || ""}
                      maxLength={30}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </Field>
                  <Field
                    label="Google Search Console token"
                    htmlFor="googleVerification"
                    hint="The content value of the google-site-verification meta tag."
                  >
                    <Input
                      id="googleVerification"
                      name="googleVerification"
                      defaultValue={settings.googleVerification || ""}
                      maxLength={300}
                    />
                  </Field>
                  <Field
                    label="Bing Webmaster token"
                    htmlFor="bingVerification"
                    hint="The content value of the msvalidate.01 meta tag."
                    className="sm:col-span-2"
                  >
                    <Input
                      id="bingVerification"
                      name="bingVerification"
                      defaultValue={settings.bingVerification || ""}
                      maxLength={300}
                    />
                  </Field>

                  <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                    <Checkbox
                      name="resumePublicEnabled"
                      label="Public resume downloads"
                      description="When disabled, the resume page hides the PDF download and the API returns unavailable."
                      defaultChecked={settings.resumePublicEnabled}
                    />
                    <Checkbox
                      name="maintenanceMode"
                      label="Maintenance mode"
                      description="Public pages display a maintenance notice. The admin dashboard, API routes and media remain available."
                      defaultChecked={settings.maintenanceMode}
                    />
                  </div>
                </div>
              </ActionForm>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <Panel
            title="Environment configuration"
            description={`${configuredCount} of ${environment.length} recommended services configured.`}
          >
            <ul className="space-y-2">
              {environment.map((entry) => (
                <li key={entry.label} className="flex items-start gap-2">
                  {entry.ok ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                  ) : (
                    <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium">{entry.label}</p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      {entry.ok ? entry.detail : "Not configured. Set this in the environment before deploying."}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
              Secrets are read from the server environment and are never displayed or stored in the database.
            </p>
          </Panel>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" aria-hidden />
              <h3 className="text-xs font-semibold">Security status</h3>
            </div>
            <ul className="mt-2.5 space-y-2 text-[10px] leading-relaxed text-muted-foreground">
              <li className="flex items-center justify-between gap-2">
                <span>Admin registration</span>
                <Badge tone="success">Disabled</Badge>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Setup route</span>
                <Badge tone="neutral">Single-use</Badge>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Rate limiting</span>
                <Badge tone="success">Active</Badge>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Audit logging</span>
                <Badge tone="success">Active</Badge>
              </li>
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
              Remove ADMIN_SETUP_TOKEN from the environment after the first admin account is created.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
            <p className="text-xs font-semibold text-foreground">Generated files</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link href="/sitemap.xml" target="_blank" className="font-medium text-accent hover:underline">
                  /sitemap.xml
                </Link>
              </li>
              <li>
                <Link href="/robots.txt" target="_blank" className="font-medium text-accent hover:underline">
                  /robots.txt
                </Link>
              </li>
              <li>
                <Link href="/api/og" target="_blank" className="font-medium text-accent hover:underline">
                  /api/og
                </Link>
              </li>
              <li>
                <Link href="/manifest.webmanifest" target="_blank" className="font-medium text-accent hover:underline">
                  /manifest.webmanifest
                </Link>
              </li>
            </ul>
            <p className="mt-3 border-t border-border pt-3">
              Last updated {formatDateTime(settings.updatedAt)}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
