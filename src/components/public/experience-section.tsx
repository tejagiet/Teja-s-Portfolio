import { Reveal } from "@/components/public/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { EXPERIENCE_TYPES } from "@/lib/constants";
import type { PublicPortfolio } from "@/lib/public-data";
import { formatDateRange } from "@/lib/utils";

export function ExperienceSection({ experiences }: { experiences: PublicPortfolio["experiences"] }) {
  return (
    <section id="experience" className="scroll-mt-24 border-t border-border bg-muted/20 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Experience"
          title="Where the work has happened."
          description="Verified roles, internships and open-source contributions are added here as they are completed."
        />

        {experiences.length ? (
          <div className="relative ml-1 border-l border-border pl-6 sm:ml-3 sm:pl-8">
            {experiences.map((experience, index) => (
              <Reveal key={experience.id} delay={Math.min(index * 0.05, 0.2)} className="relative pb-10 last:pb-0">
                <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-accent shadow-[0_0_0_1px_var(--accent)] sm:-left-[39px]" />
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight">{experience.role}</h3>
                      <p className="mt-0.5 text-xs text-accent">{experience.organization}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium text-muted-foreground">
                        {formatDateRange(experience.startDate, experience.endDate, experience.isCurrent)}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                        {EXPERIENCE_TYPES.find((type) => type.value === experience.type)?.label || experience.type}
                        {experience.location ? ` · ${experience.location}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{experience.description}</p>
                  {experience.highlights.length ? (
                    <ul className="mt-3 space-y-1.5">
                      {experience.highlights.map((highlight) => (
                        <li key={highlight} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="Briefcase"
            title="No experience entries published yet"
            description="This section is ready for verified roles, internships and open-source work. Nothing is invented — entries appear only after they are added by the admin."
          />
        )}
      </div>
    </section>
  );
}
