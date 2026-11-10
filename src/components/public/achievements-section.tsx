import { Trophy } from "lucide-react";

import { Reveal } from "@/components/public/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import type { PublicPortfolio } from "@/lib/public-data";
import { formatDate } from "@/lib/utils";

export function AchievementsSection({
  achievements,
}: {
  achievements: PublicPortfolio["achievements"];
}) {
  return (
    <section id="achievements" className="scroll-mt-24 border-t border-border bg-muted/20 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Achievements"
          title="Milestones worth recording."
          description="A factual record of awards, recognitions and completed milestones. Entries are published only when verified."
        />

        {achievements.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement, index) => (
              <Reveal key={achievement.id} delay={Math.min(index * 0.05, 0.2)}>
                <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Trophy className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold tracking-tight">{achievement.title}</h3>
                      {achievement.date ? (
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(achievement.date)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="Trophy"
            title="Achievements will appear here"
            description="No achievements have been published yet. This section is ready for verified awards and milestones."
          />
        )}
      </div>
    </section>
  );
}
