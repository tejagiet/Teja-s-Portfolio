import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";

import { ProjectCover } from "@/components/public/project-cover";
import { BrandIcon } from "@/components/ui/brand-icon";
import { PROJECT_STATUS } from "@/lib/constants";
import type { ProjectStatus } from "@prisma/client";
import { cn, truncate } from "@/lib/utils";

export type ProjectCardData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: ProjectStatus;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  techStack: string[];
};

export function ProjectCard({ project, priority = false }: { project: ProjectCardData; priority?: boolean }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-hover">
      <Link href={`/projects/${project.slug}`} className="block" aria-label={`View ${project.title}`}>
        <ProjectCover
          title={project.title}
          category={project.category}
          status={project.status}
          imageUrl={project.coverImageUrl}
          alt={project.coverImageAlt}
          priority={priority}
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2.5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span>{project.category}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />
          <span className={cn(PROJECT_STATUS[project.status].tone, "rounded-full px-1.5 py-0.5 ring-1 ring-inset")}>
            {PROJECT_STATUS[project.status].label}
          </span>
        </div>
        <h3 className="text-balance text-base font-semibold tracking-[-0.015em]">
          <Link href={`/projects/${project.slug}`} className="transition-colors hover:text-accent">
            {project.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {truncate(project.description, 150)}
        </p>

        {project.techStack.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.techStack.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[10px] text-muted-foreground"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 3 ? (
              <span className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[10px] text-muted-foreground">
                +{project.techStack.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-1.5">
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${project.title} on GitHub`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <BrandIcon name="github" className="h-3.5 w-3.5" />
              </a>
            ) : null}
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${project.title} live demo`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Play className="h-3.5 w-3.5" />
              </a>
            ) : null}
            {!project.githubUrl && !project.liveUrl ? (
              <span className="text-[10px] text-muted-foreground/70">Links pending</span>
            ) : null}
          </div>
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent"
          >
            Details
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
