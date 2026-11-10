import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[75vh] w-full max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-accent shadow-sm">
        <SearchX className="h-6 w-6" aria-hidden />
      </div>
      <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">This page could not be found.</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        The link may be outdated, or the page may have moved. Head back to the portfolio or explore the
        project archive.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
        <Link href="/" className={buttonVariants({ className: "rounded-full" })}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back home
        </Link>
        <Link
          href="/projects"
          className={buttonVariants({ variant: "outline", className: "rounded-full" })}
        >
          View projects
        </Link>
      </div>
    </div>
  );
}
