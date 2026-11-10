import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink, Play } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { ProjectCover } from "@/components/public/project-cover";
import { RichText } from "@/components/public/rich-text";
import { BrandIcon } from "@/components/ui/brand-icon";
import { buttonVariants } from "@/components/ui/button";
import { PROJECT_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { breadcrumbJsonLd, buildPageMetadata, projectDescription } from "@/lib/seo";
import { cn, formatDate } from "@/lib/utils";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

async function getProject(slug: string) {
  return db.project.findFirst({
    where: { slug, published: true },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) {
    return { title: "Project not found", robots: { index: false, follow: false } };
  }
  return buildPageMetadata({
    pageKey: `project:${project.slug}`,
    path: `/projects/${project.slug}`,
    fallbackTitle: `${project.title} — Teja Manikanta`,
    fallbackDescription: projectDescription(
      project.description,
      `A project by Teja Manikanta: ${project.title}.`,
    ),
    fallbackImage: project.coverImageUrl,
    type: "article",
    keywords: [project.category, ...project.techStack],
  });
}

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProject(slug), getSiteSettings()]);
  if (!project) notFound();

  const status = PROJECT_STATUS[project.status];
  const projectUrl = `${settings.siteUrl}/projects/${project.slug}`;
  const dates =
    project.startDate || project.endDate
      ? [formatDate(project.startDate), project.endDate ? formatDate(project.endDate) : project.startDate ? "Present" : ""]
          .filter(Boolean)
          .join(" — ")
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            description: project.description,
            url: projectUrl,
            image: project.coverImageUrl || undefined,
            creator: { "@type": "Person", name: "Teja Manikanta" },
            keywords: project.techStack.join(", "),
            dateModified: project.updatedAt.toISOString(),
            genre: project.category,
          },
          breadcrumbJsonLd([
            { name: "Home", url: settings.siteUrl },
            { name: "Projects", url: `${settings.siteUrl}/projects` },
            { name: project.title, url: projectUrl },
          ]),
        ]}
      />

      <Breadcrumbs items={[{ name: "Projects", href: "/projects" }, { name: project.title }]} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {project.category}
        </span>
        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset", status.tone)}>
          {status.label}
        </span>
        {project.featured ? (
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-foreground ring-1 ring-inset ring-accent/20">
            Featured
          </span>
        ) : null}
      </div>

      <div className="mt-5 max-w-3xl">
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          {project.title}
        </h1>
        {project.subtitle ? <p className="mt-2 text-sm text-accent">{project.subtitle}</p> : null}
        <p className="mt-5 text-[15px] leading-[1.8] text-muted-foreground">{project.description}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        {project.liveUrl ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonVariants({ size: "md", className: "rounded-full" })}
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            Live demo
          </a>
        ) : null}
        {project.githubUrl ? (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonVariants({ variant: "outline", size: "md", className: "rounded-full" })}
          >
            <BrandIcon name="github" className="h-3.5 w-3.5" />
            Source code
          </a>
        ) : null}
        <Link
          href="/projects"
          className={buttonVariants({ variant: "ghost", size: "md", className: "rounded-full" })}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All projects
        </Link>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
        <ProjectCover
          title={project.title}
          category={project.category}
          imageUrl={project.coverImageUrl}
          alt={project.coverImageAlt}
          priority
          className="aspect-[16/9] sm:aspect-[21/9]"
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div>
          {project.content ? (
            <RichText content={project.content} />
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>
          )}

          {project.images.length ? (
            <div className="mt-10 border-t border-border pt-8">
              <h2 className="text-sm font-semibold tracking-tight">Gallery</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {project.images.map((image) => (
                  <figure key={image.id} className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={image.url}
                        alt={image.altText || `${project.title} gallery image`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                    {image.altText ? (
                      <figcaption className="border-t border-border p-3 text-[10px] text-muted-foreground">
                        {image.altText}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Project details
            </h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="text-right font-medium">{status.label}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="text-right font-medium">{project.category}</dd>
              </div>
              {dates ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="inline-flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" aria-hidden />
                    Timeline
                  </dt>
                  <dd className="text-right font-medium">{dates}</dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-4 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
              {status.description}
            </p>
          </div>

          {project.techStack.length ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Technologies
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-border bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Links
            </h2>
            <div className="mt-3 space-y-2 text-xs">
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-between text-muted-foreground transition-colors hover:text-foreground"
                >
                  Live demo
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              ) : null}
              {project.githubUrl ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-between text-muted-foreground transition-colors hover:text-foreground"
                >
                  Repository
                  <BrandIcon name="github" className="h-3 w-3" />
                </a>
              ) : null}
              {!project.liveUrl && !project.githubUrl ? (
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  No public links have been added for this project. Nothing is shown rather than using a
                  placeholder URL.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
