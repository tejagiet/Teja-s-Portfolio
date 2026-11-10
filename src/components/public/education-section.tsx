import { GraduationCap } from "lucide-react";

import { Reveal } from "@/components/public/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import type { PublicPortfolio } from "@/lib/public-data";

export function EducationSection({ education }: { education: PublicPortfolio["education"] }) {
  return (
    <section id="education" className="scroll-mt-24 border-t border-border py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Education"
          title="Learning with intent."
          description="Formal study in artificial intelligence, alongside continuous self-directed learning."
        />

        {education.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {education.map((entry, index) => (
              <Reveal key={entry.id} delay={index * 0.05}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 card-hover">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <GraduationCap className="h-5 w-5" aria-hidden />
                    </div>
                    <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                      {entry.isCurrent
                        ? entry.endYear
                          ? `Expected ${entry.endYear}`
                          : "In progress"
                        : [entry.startYear, entry.endYear].filter(Boolean).join(" — ")}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold tracking-tight">{entry.institution}</h3>
                  <p className="mt-1 text-xs text-accent">
                    {entry.degree}
                    {entry.field && entry.field !== entry.degree ? ` · ${entry.field}` : ""}
                  </p>
                  {entry.grade ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">Grade: {entry.grade}</p>
                  ) : null}
                  {entry.description ? (
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{entry.description}</p>
                  ) : null}
                  {entry.location ? (
                    <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                      {entry.location}
                    </p>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="GraduationCap"
            title="Education details are being added"
            description="Education entries will appear here once they are published from the admin dashboard."
          />
        )}
      </div>
    </section>
  );
}
