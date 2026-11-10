import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, RefreshCw } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ResumeDocument } from "@/components/public/resume-document";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getLatestPublishedResume } from "@/lib/resume-engine";
import { buildPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await buildPageMetadata({
    pageKey: "resume",
    path: "/resume",
    fallbackTitle: "Resume — Teja Manikanta",
    fallbackDescription:
      "The latest approved resume for Teja Manikanta, covering education, technical skills, projects and areas of focus.",
  });
  return metadata;
}

export default async function ResumePage() {
  const [resume, settings] = await Promise.all([
    getLatestPublishedResume(),
    getSiteSettings(),
  ]);

  const available = Boolean(resume && settings.resumePublicEnabled);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:px-8">
      <Breadcrumbs items={[{ name: "Resume" }]} />

      <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            <span className="h-1 w-1 rounded-full bg-accent" />
            Resume
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">The full picture.</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            The latest approved resume, generated from the same data that powers this portfolio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {available ? (
            <a
              href="/api/resume/download"
              className={buttonVariants({ size: "md", className: "rounded-full" })}
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Download PDF
            </a>
          ) : null}
          <Link
            href="/#contact"
            className={buttonVariants({ variant: "outline", size: "md", className: "rounded-full" })}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Get in touch
          </Link>
        </div>
      </div>

      {available && resume ? (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Approved version
            </span>
            {resume.publishedAt ? <span>Published {formatDate(resume.publishedAt)}</span> : null}
            <span>Template: {resume.template.name}</span>
            <span>A4 · PDF · HTML preview</span>
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-neutral-200/50 p-3 shadow-inner dark:bg-neutral-900/50 sm:p-6">
            <div className="mx-auto shadow-[0_20px_60px_-30px_rgba(0,0,0,0.4)]">
              <ResumeDocument content={resume.content} config={resume.config} />
            </div>
          </div>
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon="FileText"
            title={resume ? "Resume downloads are temporarily disabled" : "The resume is being prepared"}
            description={
              resume
                ? "The approved resume exists, but public downloads are currently disabled in the website settings."
                : "A resume becomes available here after it has been generated and approved in the admin dashboard. In the meantime, feel free to get in touch."
            }
            action={
              <Link href="/#contact" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Contact Teja
              </Link>
            }
          />
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <RefreshCw className="h-3 w-3" aria-hidden />
            This page updates automatically after approval.
          </p>
        </div>
      )}
    </div>
  );
}
