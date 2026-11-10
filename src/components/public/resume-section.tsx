import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Download, FileText } from "lucide-react";

import { Reveal } from "@/components/public/reveal";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export function ResumeSection({
  available,
  publishedAt,
}: {
  available: boolean;
  publishedAt: Date | null | undefined;
}) {
  return (
    <section id="resume" className="scroll-mt-24 border-t border-border py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-foreground p-8 text-background sm:p-12">
            <div className="absolute inset-0 grid-pattern opacity-[0.12]" aria-hidden />
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" aria-hidden />
            <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-background/60">
                  <FileText className="h-3 w-3" aria-hidden />
                  Resume
                </p>
                <h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                  The latest approved resume, always up to date.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-background/70">
                  Generated from the same profile, education, skills and project data that powers this
                  portfolio. Updates are reviewed and approved in the admin dashboard before publishing.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-background/60">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                    {available ? "Approved version available" : "Being updated"}
                  </span>
                  {publishedAt ? <span>Published {formatDate(publishedAt)}</span> : null}
                  <span>A4 · PDF</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {available ? (
                  <a
                    href="/api/resume/download"
                    className={buttonVariants({
                      variant: "primary",
                      size: "lg",
                      className: "w-full rounded-full bg-background text-foreground hover:bg-background/90",
                    })}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Download PDF
                  </a>
                ) : null}
                <Link
                  href="/resume"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className:
                      "w-full rounded-full border-background/20 bg-transparent text-background hover:bg-background/10",
                  })}
                >
                  Preview resume
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
