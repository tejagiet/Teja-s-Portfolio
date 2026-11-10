import Link from "next/link";
import { Wrench } from "lucide-react";

import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { GoogleAnalytics } from "@/components/public/google-analytics";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [profile, settings] = await Promise.all([
    db.profile.findFirst({
      select: {
        displayName: true,
        title: true,
        email: true,
        socialLinks: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
          select: { label: true, url: true, platform: true, icon: true },
        },
      },
    }),
    getSiteSettings(),
  ]);

  if (settings.maintenanceMode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background">
          TM
          <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" />
        </span>
        <p className="mt-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
          <Wrench className="h-3 w-3" aria-hidden />
          Maintenance
        </p>
        <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {settings.siteName} is being updated.
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          The public site is temporarily unavailable while changes are published. Please check back shortly.
        </p>
        {settings.contactEmail || profile?.email ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Need to reach out?{" "}
            <a
              href={`mailto:${settings.contactEmail || profile?.email}`}
              className="font-medium text-accent hover:underline"
            >
              {settings.contactEmail || profile?.email}
            </a>
          </p>
        ) : null}
        <Link
          href="/admin/login"
          className="mt-8 text-[10px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        >
          Administrator sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter
        name={profile?.displayName || "Teja Manikanta"}
        title={profile?.title || "Full-Stack Developer | Software Engineer"}
        socialLinks={profile?.socialLinks || []}
        contactEmail={profile?.email || settings.contactEmail}
        footerNote={settings.footerNote}
        siteName={settings.siteName}
      />
      {settings.analyticsId ? <GoogleAnalytics measurementId={settings.analyticsId} /> : null}
    </div>
  );
}
