import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, Star } from "lucide-react";
import type { ProjectStatus } from "@prisma/client";

import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ListToolbar, TableShell, Td, Th } from "@/components/admin/collection";
import { PageHeader } from "@/components/admin/page-header";
import { ToggleAction } from "@/components/admin/toggle-action";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/form";
import { PROJECT_STATUS, PROJECT_STATUS_OPTIONS } from "@/lib/constants";
import { db } from "@/lib/db";
import { deleteProjectAction, toggleProjectFeaturedAction, toggleProjectPublishedAction } from "@/lib/actions/projects";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Projects" };

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; visibility?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = PROJECT_STATUS_OPTIONS.some((option) => option.value === params.status)
    ? (params.status as ProjectStatus)
    : undefined;
  const visibility =
    params.visibility === "published" ? true : params.visibility === "drafts" ? false : undefined;

  const where = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(visibility === undefined ? {} : { published: visibility }),
  };

  const [projects, total, published, drafts, featured] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      include: {
        _count: { select: { images: true } },
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, altText: true } },
      },
    }),
    db.project.count(),
    db.project.count({ where: { published: true } }),
    db.project.count({ where: { published: false } }),
    db.project.count({ where: { featured: true } }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Projects"
        description="Record projects honestly: publish what exists, keep concepts clearly labelled and leave links, screenshots or metrics blank until they are real."
        actions={
          <Link
            href="/admin/projects/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground transition-all hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            New project
          </Link>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        {[
          { label: "All records", value: total },
          { label: "Published", value: published },
          { label: "Drafts", value: drafts },
          { label: "Featured", value: featured },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card px-3 py-2">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <ListToolbar defaultValue={q} placeholder="Search title, category or description…">
        <Select name="status" defaultValue={status || ""} className="h-9 w-auto text-xs sm:w-40" aria-label="Filter by status">
          <option value="">All statuses</option>
          {PROJECT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          name="visibility"
          defaultValue={params.visibility || ""}
          className="h-9 w-auto text-xs sm:w-36"
          aria-label="Filter by visibility"
        >
          <option value="">All visibility</option>
          <option value="published">Published</option>
          <option value="drafts">Drafts</option>
        </Select>
      </ListToolbar>

      {projects.length ? (
        <TableShell>
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr>
                <Th>Project</Th>
                <Th>Status</Th>
                <Th>Gallery</Th>
                <Th>Order</Th>
                <Th>Updated</Th>
                <Th>Published</Th>
                <Th>Featured</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {project.coverImageUrl || project.images[0]?.url ? (
                          <Image
                            src={project.coverImageUrl || project.images[0]!.url}
                            alt={project.coverImageAlt || project.images[0]?.altText || project.title}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[8px] text-muted-foreground">
                            No cover
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-[18rem] truncate font-medium">{project.title}</p>
                        <p className="max-w-[18rem] truncate text-[10px] text-muted-foreground">
                          /{project.slug} · {project.category}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide ring-1 ring-inset ${PROJECT_STATUS[project.status].tone}`}
                    >
                      {PROJECT_STATUS[project.status].label}
                    </span>
                  </Td>
                  <Td className="text-muted-foreground">{project._count.images}</Td>
                  <Td className="tabular-nums text-muted-foreground">{project.sortOrder}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{formatDate(project.updatedAt)}</Td>
                  <Td>
                    <ToggleAction
                      id={project.id}
                      checked={project.published}
                      action={toggleProjectPublishedAction}
                      label={`${project.published ? "Unpublish" : "Publish"} ${project.title}`}
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <ToggleAction
                        id={project.id}
                        checked={project.featured}
                        action={toggleProjectFeaturedAction}
                        label={`${project.featured ? "Remove" : "Feature"} ${project.title}`}
                      />
                      {project.featured ? <Star className="h-3 w-3 fill-amber-400 text-amber-500" aria-hidden /> : null}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/projects/${project.slug}`}
                        target="_blank"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                        aria-label={`View ${project.title}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Link>
                      <ConfirmDelete
                        id={project.id}
                        name={project.title}
                        action={deleteProjectAction}
                        size="icon"
                        description="The project record and its gallery references will be deleted. Uploaded media files stay in the library."
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : (
        <EmptyState
          icon="FolderKanban"
          title={q || status || visibility !== undefined ? "No projects match these filters" : "No projects yet"}
          description={
            q || status || visibility !== undefined
              ? "Try clearing the search or filters."
              : "Create the first project record. Publish it only when the description is accurate."
          }
          action={
            <Link
              href="/admin/projects/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              New project
            </Link>
          }
        />
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        {published} published · {drafts} draft{drafts === 1 ? "" : "s"} · {featured} featured. Unpublished drafts never
        appear on the public site or in the resume.
      </p>
    </div>
  );
}
