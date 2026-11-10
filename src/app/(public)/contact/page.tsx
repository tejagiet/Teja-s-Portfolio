import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ContactSection } from "@/components/public/contact-section";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { buildPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    pageKey: "contact",
    path: "/contact",
    fallbackTitle: "Contact — Teja Manikanta",
    fallbackDescription:
      "Get in touch with Teja Manikanta about software development, projects and collaboration.",
  });
}

export default async function ContactPage() {
  const [profile, settings] = await Promise.all([db.profile.findFirst(), getSiteSettings()]);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8">
      <Breadcrumbs items={[{ name: "Contact" }]} />
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
          <span className="h-1 w-1 rounded-full bg-accent" />
          Contact
        </p>
        <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Start a conversation.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Questions, ideas, collaboration or opportunities — messages are stored securely and reviewed
          through the admin dashboard.
        </p>
      </div>

      {profile ? (
        <ContactSection
          profile={{ ...profile, socialLinks: [] }}
          fallbackEmail={settings.contactEmail}
          availability={settings.availabilityNote}
        />
      ) : (
        <EmptyState
          icon="Mail"
          title="Contact details are being configured"
          description="The profile has not been created yet. Use the admin dashboard to add contact information."
          action={
            <Link href="/admin/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Open admin
            </Link>
          }
        />
      )}
    </div>
  );
}
