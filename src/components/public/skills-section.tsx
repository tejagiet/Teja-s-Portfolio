import { Reveal } from "@/components/public/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import type { PublicPortfolio } from "@/lib/public-data";

const categoryIcons: Record<string, string> = {
  frontend: "Code2",
  backend: "Server",
  databases: "Database",
  "cloud-devops": "Cloud",
  "ai-data": "Brain",
  mobile: "Smartphone",
  systems: "Layers",
};

export function SkillsSection({ categories }: { categories: PublicPortfolio["skillCategories"] }) {
  return (
    <section id="skills" className="scroll-mt-24 border-t border-border bg-muted/20 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Technical skills"
          title="The tools behind the work."
          description="A working stack for building complete applications — from the interface and API layer to the database and deployment."
        />

        {categories.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Reveal key={category.id} delay={Math.min(index * 0.05, 0.25)}>
                <div className="group h-full rounded-2xl border border-border bg-card p-5 card-hover">
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <Icon name={categoryIcons[category.slug] || "Layers"} className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] tabular-nums text-muted-foreground/70">
                      {String(category.skills.length).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold tracking-tight">{category.name}</h3>
                  {category.description ? (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      {category.description}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {category.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-md border border-border bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground transition-colors group-hover:border-border"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                  {category.skills.some((skill) => skill.level !== null) ? (
                    <div className="mt-4 space-y-2 border-t border-border pt-3">
                      {category.skills
                        .filter((skill) => skill.level !== null)
                        .map((skill) => (
                          <div key={skill.id}>
                            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>{skill.name}</span>
                              <span className="tabular-nums">{skill.level}%</span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${skill.level}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="Sparkles"
            title="Skills are being documented"
            description="Technical skill categories will appear here once they are added in the admin dashboard."
          />
        )}
      </div>
    </section>
  );
}
