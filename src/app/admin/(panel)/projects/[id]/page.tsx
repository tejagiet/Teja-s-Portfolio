import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { ActionForm } from "@/components/admin/action-form";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageField } from "@/components/admin/image-field";
import { PageHeader } from "@/components/admin/page-header";
import { ProjectGalleryManager } from "@/components/admin/project-gallery-manager";
import { Badge } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  addProjectImageAction,
  deleteProjectAction,
  deleteProjectImageAction,
  saveProjectAction,
  updateProjectImageAltAction,
} from "@/lib/actions/projects";
import { uploadMediaAction } from "@/lib/actions/media";
import { PROJECT_STATUS, PROJECT_STATUS_OPTIONS } from "@/lib/constants";
import { db } from "@/lib/db";
import { toDateInput } from "@/lib/utils";

export const metadata: Metadata = { title: "Project editor" };

export const dynamic = "force-dynamic";

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const project = isNew
    ? null
    : await db.project.findUnique({
        where: { id },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      });

  if (!isNew && !project) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={isNew ? "Content · Projects" : "Content · Edit project"}
        title={isNew ? "New project" : project!.title}
        description={
          isNew
            ? "Create a project record. Keep it unpublished until the description and any links are accurate."
            : "Edit the project record, cover image, gallery and publishing state."
        }
        actions={
          <>
            <Link
              href="/admin/projects"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All projects
            </Link>
            {project?.published ? (
              <Link
                href={`/projects/${project.slug}`}
                target="_blank"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View public page
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : null}
          </>
        }
      />

      <ActionForm
        action={saveProjectAction}
        id="project-form"
        submitLabel={isNew ? "Create project" : "Save project"}
      >
        {project ? <input type="hidden" name="id" value={project.id} /> : null}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold tracking-tight">Project details</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                The description is used in cards and metadata. The long-form content supports headings (##), lists (-)
                and links in the format [label](url).
              </p>
            </div>
            <div className="p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title" htmlFor="title" className="sm:col-span-2">
                  <Input id="title" name="title" defaultValue={project?.title || ""} required maxLength={140} />
                </Field>
                <Field label="Slug" htmlFor="slug" hint="Leave blank to generate from the title. Lowercase, hyphens only.">
                  <Input id="slug" name="slug" defaultValue={project?.slug || ""} maxLength={90} pattern="[a-z0-9-]*" />
                </Field>
                <Field label="Subtitle" htmlFor="subtitle">
                  <Input id="subtitle" name="subtitle" defaultValue={project?.subtitle || ""} maxLength={200} />
                </Field>
                <Field label="Category" htmlFor="category" hint="e.g. Web applications, AI & computer vision, Integration.">
                  <Input id="category" name="category" defaultValue={project?.category || ""} required maxLength={60} />
                </Field>
                <Field label="Status" htmlFor="status" hint="Keep concepts clearly labelled as concepts.">
                  <Select id="status" name="status" defaultValue={project?.status || "CONCEPT"}>
                    {PROJECT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Short description"
                  htmlFor="description"
                  className="sm:col-span-2"
                  hint="At least 20 characters. Aim for 1–3 honest sentences."
                >
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={project?.description || ""}
                    required
                    minLength={20}
                    maxLength={1200}
                    className="min-h-24"
                  />
                </Field>
                <Field
                  label="Long-form content"
                  htmlFor="content"
                  className="sm:col-span-2"
                  hint="Optional detail page content. No fabricated outcomes, metrics or screenshots."
                >
                  <Textarea
                    id="content"
                    name="content"
                    defaultValue={project?.content || ""}
                    maxLength={20000}
                    className="min-h-64 font-mono text-[11px] leading-relaxed"
                  />
                </Field>
                <Field
                  label="Tech stack"
                  htmlFor="techStack"
                  hint="Only list technology actually used. One per line or comma separated."
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="techStack"
                    name="techStack"
                    defaultValue={project?.techStack.join("\n") || ""}
                    maxLength={2000}
                    className="min-h-20"
                  />
                </Field>
                <Field label="Live URL" htmlFor="liveUrl" hint="Leave blank unless a real, working link exists.">
                  <Input
                    id="liveUrl"
                    name="liveUrl"
                    type="url"
                    defaultValue={project?.liveUrl || ""}
                    maxLength={600}
                    placeholder="https://…"
                  />
                </Field>
                <Field label="Source URL" htmlFor="githubUrl" hint="Leave blank unless a public repository exists.">
                  <Input
                    id="githubUrl"
                    name="githubUrl"
                    type="url"
                    defaultValue={project?.githubUrl || ""}
                    maxLength={600}
                    placeholder="https://github.com/…"
                  />
                </Field>
                <Field label="Start date" htmlFor="startDate">
                  <Input id="startDate" name="startDate" type="date" defaultValue={toDateInput(project?.startDate)} />
                </Field>
                <Field label="End date" htmlFor="endDate" hint="Leave blank if ongoing or undated.">
                  <Input id="endDate" name="endDate" type="date" defaultValue={toDateInput(project?.endDate)} />
                </Field>
              </div>
            </div>
          </section>

          <div className="space-y-4">
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-xs font-semibold">Publishing</h2>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                Published projects appear on the public site and in the resume. Featured projects lead the homepage.
              </p>
              <div className="mt-3 space-y-2">
                <Checkbox
                  name="published"
                  label="Published"
                  description="Show this project on the public site and include it in generated resumes."
                  defaultChecked={project?.published ?? false}
                />
                <Checkbox
                  name="featured"
                  label="Featured on the homepage"
                  description="Featured projects appear first in the selected projects section."
                  defaultChecked={project?.featured ?? false}
                />
                <div>
                  <label htmlFor="sortOrder" className="mb-1 block text-[10px] font-medium text-muted-foreground">
                    Sort order
                  </label>
                  <Input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    min={0}
                    max={9999}
                    defaultValue={project?.sortOrder ?? 0}
                    className="h-8 text-[11px]"
                  />
                </div>
              </div>
              <Badge tone={project?.published ? "success" : "neutral"} className="mt-2">
                {project?.published ? "Currently published" : "Currently a draft"}
              </Badge>
              {project ? (
                <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                  The public page is /projects/{project.slug}. Changing the slug creates a new URL and leaves the old
                  one unmanaged unless you add a redirect.
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-border bg-card p-4">
              <ImageField
                name="coverImageUrl"
                label="Cover image"
                value={project?.coverImageUrl || ""}
                uploadAction={uploadMediaAction}
                folder="projects"
                aspect={16 / 10}
                hint="Recommended 1600×1000. Images are converted to WebP automatically."
              />
              <div className="mt-3">
                <Field label="Cover image alt text" htmlFor="coverImageAlt" hint="Required when a cover image is set.">
                  <Input
                    id="coverImageAlt"
                    name="coverImageAlt"
                    defaultValue={project?.coverImageAlt || ""}
                    maxLength={300}
                  />
                </Field>
              </div>
            </section>

            {project ? (
              <div className="rounded-2xl border border-border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">Record details</p>
                <p className="mt-1">
                  Status: {PROJECT_STATUS[project.status].label}. Gallery: {project.images.length} image
                  {project.images.length === 1 ? "" : "s"}.
                </p>
                <p className="mt-1">Use the gallery below the form to add and describe images after saving.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-4 text-[10px] leading-relaxed text-muted-foreground">
                Save the project first to unlock gallery uploads and permanent editing.
              </div>
            )}
          </div>
        </div>
      </ActionForm>

      {project ? (
        <div className="mt-5 space-y-5">
          <ProjectGalleryManager
            projectId={project.id}
            images={project.images.map((image) => ({
              id: image.id,
              url: image.url,
              altText: image.altText,
              sortOrder: image.sortOrder,
            }))}
            uploadAction={uploadMediaAction}
            addAction={addProjectImageAction}
            updateAltAction={updateProjectImageAltAction}
            deleteAction={deleteProjectImageAction}
          />

          <section className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-4">
            <h2 className="text-xs font-semibold">Danger zone</h2>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              Deleting a project also deletes its gallery references. Uploaded media files remain in the media
              library.
            </p>
            <div className="mt-3">
              <ConfirmDelete
                id={project.id}
                name={project.title}
                action={deleteProjectAction}
                label="Delete project"
                redirectTo="/admin/projects"
                description="This permanently removes the project record and its gallery references."
              />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
