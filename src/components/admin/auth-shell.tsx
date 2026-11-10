import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Icon } from "@/components/ui/icon";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 grid-pattern opacity-[0.08]" aria-hidden />
        <div className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-accent/25 blur-[100px]" aria-hidden />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-[90px]" aria-hidden />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-background text-xs font-bold text-foreground">
              TM
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Teja Manikanta</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-background/50">
            <Sparkles className="h-3 w-3" aria-hidden />
            Portfolio management
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em]">
            One place for the entire portfolio.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-background/60">
            Manage projects, profile content, the resume library, media, messages and technical SEO —
            with every change reflected on the public site immediately.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Database-backed content with draft and publish control",
              "Automated resume drafts after professional updates",
              "A real SEO audit built from your actual content",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-xs text-background/70">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-background/10">
                  <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between text-[10px] text-background/40">
          <span>Admin workspace</span>
          <span>Next.js · Prisma · Neon</span>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to site
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-foreground text-xs font-bold text-background">
                TM
                <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent" />
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-7">{children}</div>
            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 px-5 pb-6 text-[10px] text-muted-foreground">
          <Icon name="ShieldCheck" className="h-3 w-3" />
          Protected admin area · No public registration
        </div>
      </div>
    </div>
  );
}
