import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ProjectCard } from "@/components/public/project-card";
import { Reveal } from "@/components/public/reveal";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PROJECT_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    pageKey: "projects",
    path: "/projects",
    fallbackTitle: "Projects — Teja Manikanta",
    fallbackDescription:
      "Software projects by Teja Manikanta across full-stack web applications, backend systems, AI, Android and software-hardware integration.",
  });
}

type SearchParams = Promise<{ q?: string; category?: string; status?: string }>;

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (params.q || "").trim().toLowerCase();
  const category = params.category || "all";
  const status = params.status || "all";

  const projects = await db.project.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const categories = Array.from(new Set(projects.map((project) => project.category))).sort();
  const statuses = Object.keys(PROJECT_STATUS) as Array<keyof typeof PROJECT_STATUS>;

  const filtered = projects.filter((project) => {
    if (category !== "all" && project.category !== category) return false;
    if (status !== "all" && project.status !== status) return false;
    if (query) {
      const haystack = [
        project.title,
        project.description,
        project.category,
        ...project.techStack,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const hasFilters = Boolean(query) || category !== "all" || status !== "all";

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8">
      <Breadcrumbs items={[{ name: "Projects" }]} />

      <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            <span className="h-1 w-1 rounded-full bg-accent" />
            Project archive
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Projects.</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A catalogue of software work and explorations. Every record states its real status — links
            and screenshots appear only when they exist.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span> of {projects.length} published
        </p>
      </div>

      <form
        method="get"
        action="/projects"
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={params.q || ""}
            placeholder="Search projects, technologies, categories…"
            aria-label="Search projects"
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            name="category"
            defaultValue={category}
            aria-label="Filter by category"
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs outline-none focus:border-accent/60"
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status}
            aria-label="Filter by status"
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs outline-none focus:border-accent/60"
          >
            <option value="all">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {PROJECT_STATUS[item].label}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonVariants({ size: "sm", className: "h-9" })}>
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Filter
          </button>
          {hasFilters ? (
            <Link href="/projects" className="px-2 text-[11px] text-muted-foreground hover:text-foreground">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {filtered.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, index) => (
            <Reveal key={project.id} delay={Math.min(index * 0.04, 0.2)}>
              <ProjectCard project={project} priority={index < 3} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon="Search"
            title={hasFilters ? "No projects match those filters" : "Projects are being documented"}
            description={
              hasFilters
                ? "Try a different search term, category or status."
                : "Published project records will appear here once they are added in the admin dashboard."
            }
            action={
              hasFilters ? (
                <Link href="/projects" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
