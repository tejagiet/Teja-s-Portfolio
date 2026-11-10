import Link from "next/link";

import { ProjectCard } from "@/components/public/project-card";
import { Reveal } from "@/components/public/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import type { PublicPortfolio } from "@/lib/public-data";

export function ProjectsSection({ projects }: { projects: PublicPortfolio["projects"] }) {
  const displayed = projects.slice(0, 6);

  return (
    <section id="projects" className="scroll-mt-24 border-t border-border py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Selected projects"
          title="Software, systems and experiments."
          description="A growing record of work across campus platforms, business software, integrations, AI and mobile."
          href="/projects"
          hrefLabel="All projects"
        />

        {displayed.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayed.map((project, index) => (
                <Reveal key={project.id} delay={Math.min(index * 0.05, 0.25)}>
                  <ProjectCard project={project} priority={index < 2} />
                </Reveal>
              ))}
            </div>
            {projects.length > displayed.length ? (
              <div className="mt-8 flex justify-center">
                <Link
                  href="/projects"
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground"
                >
                  Explore all {projects.length} project records
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon="FolderKanban"
            title="Projects are being documented"
            description="Published project records will appear here. Each entry is managed from the admin dashboard, with honest status and links."
          />
        )}
      </div>
    </section>
  );
}
