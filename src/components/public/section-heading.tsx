import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/public/reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "View all",
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal className={cn("mb-10 flex flex-col gap-5", align === "center" && "items-center text-center")}>
      <div className={cn("flex w-full items-end justify-between gap-6", align === "center" && "justify-center")}>
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            <span className="h-1 w-1 rounded-full bg-accent" />
            {eyebrow}
          </p>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="group hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground sm:inline-flex"
          >
            {hrefLabel}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent sm:hidden"
        >
          {hrefLabel}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </Reveal>
  );
}
