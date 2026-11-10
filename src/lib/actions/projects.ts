"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity";
import { assertAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { syncResumeState } from "@/lib/resume-engine";
import { slugify } from "@/lib/utils";
import {
  actionError,
  actionSuccess,
  fdBool,
  fdDate,
  fdList,
  fdNumber,
  fdOptional,
  fdString,
  projectImageSchema,
  projectSchema,
  zodError,
  type ActionState,
} from "@/lib/validation";

function refreshProjectPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/resume");
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  if (slug) revalidatePath(`/projects/${slug}`);
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || `project-${Date.now()}`;
  let candidate = root;
  let suffix = 2;
  for (;;) {
    const clash = await db.project.findFirst({
      where: excludeId ? { slug: candidate, NOT: { id: excludeId } } : { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
}

export async function saveProjectAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const id = fdString(formData, "id");

  const parsed = projectSchema.safeParse({
    title: fdString(formData, "title"),
    slug: fdOptional(formData, "slug"),
    subtitle: fdOptional(formData, "subtitle"),
    description: fdString(formData, "description"),
    content: fdString(formData, "content"),
    category: fdString(formData, "category"),
    status: fdString(formData, "status"),
    featured: fdBool(formData, "featured"),
    published: fdBool(formData, "published"),
    coverImageUrl: fdOptional(formData, "coverImageUrl"),
    coverImageAlt: fdOptional(formData, "coverImageAlt"),
    githubUrl: fdOptional(formData, "githubUrl"),
    liveUrl: fdOptional(formData, "liveUrl"),
    techStack: fdList(formData, "techStack"),
    startDate: fdDate(formData, "startDate"),
    endDate: fdDate(formData, "endDate"),
    sortOrder: fdNumber(formData, "sortOrder", 0) ?? 0,
  });
  if (!parsed.success) return zodError(parsed.error);

  const data = parsed.data;
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    return actionError("The end date cannot be before the start date.");
  }
  if (data.coverImageUrl && !data.coverImageAlt) {
    return actionError("Add alt text for the cover image so the page stays accessible and SEO-friendly.");
  }

  try {
    const slug = await uniqueSlug(data.slug || data.title, id || undefined);
    const payload = {
      title: data.title,
      slug,
      subtitle: data.subtitle || null,
      description: data.description,
      content: data.content,
      category: data.category,
      status: data.status,
      featured: data.featured,
      published: data.published,
      coverImageUrl: data.coverImageUrl || null,
      coverImageAlt: data.coverImageAlt || null,
      githubUrl: data.githubUrl || null,
      liveUrl: data.liveUrl || null,
      techStack: data.techStack,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      sortOrder: data.sortOrder,
    };

    let projectId = id;
    if (id) {
      const existing = await db.project.findUnique({ where: { id } });
      if (!existing) return actionError("That project no longer exists.");
      await db.project.update({ where: { id }, data: payload });
      await logActivity({
        userId: user.id,
        action: "UPDATE",
        entityType: "project",
        entityId: id,
        description: `Updated project “${data.title}”`,
        metadata: { published: data.published },
      });
    } else {
      const created = await db.project.create({ data: payload });
      projectId = created.id;
      await logActivity({
        userId: user.id,
        action: "CREATE",
        entityType: "project",
        entityId: created.id,
        description: `Created project “${data.title}”`,
      });
    }

    await syncResumeState(user.id);
    refreshProjectPaths(slug);
    revalidatePath(`/admin/projects/${projectId}`);
    return actionSuccess(id ? "Project saved." : "Project created.", {
      redirectTo: `/admin/projects/${projectId}`,
    });
  } catch (error) {
    console.error("[project-save]", error);
    return actionError("The project could not be saved.");
  }
}

export async function deleteProjectAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const project = await db.project.findUnique({ where: { id } });
    if (!project) return actionError("That project no longer exists.");

    await db.project.delete({ where: { id } });
    await syncResumeState(user.id);
    await logActivity({
      userId: user.id,
      action: "DELETE",
      entityType: "project",
      entityId: id,
      description: `Deleted project “${project.title}”`,
    });
    refreshProjectPaths(project.slug);
    return actionSuccess("Project deleted.");
  } catch (error) {
    console.error("[project-delete]", error);
    return actionError("The project could not be deleted.");
  }
}

export async function toggleProjectPublishedAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const project = await db.project.findUnique({ where: { id } });
    if (!project) return actionError("That project no longer exists.");

    const published = !project.published;
    await db.project.update({ where: { id }, data: { published } });
    await syncResumeState(user.id);
    await logActivity({
      userId: user.id,
      action: published ? "PUBLISH" : "UNPUBLISH",
      entityType: "project",
      entityId: id,
      description: `${published ? "Published" : "Unpublished"} project “${project.title}”`,
    });
    refreshProjectPaths(project.slug);
    return actionSuccess(published ? "Project published." : "Project moved to drafts.");
  } catch (error) {
    console.error("[project-publish]", error);
    return actionError("The project status could not be changed.");
  }
}

export async function toggleProjectFeaturedAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const project = await db.project.findUnique({ where: { id } });
    if (!project) return actionError("That project no longer exists.");

    const featured = !project.featured;
    await db.project.update({ where: { id }, data: { featured } });
    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: "project",
      entityId: id,
      description: `${featured ? "Featured" : "Unfeatured"} project “${project.title}”`,
    });
    refreshProjectPaths(project.slug);
    return actionSuccess(featured ? "Project featured on the homepage." : "Project removed from featured.");
  } catch (error) {
    console.error("[project-feature]", error);
    return actionError("The featured status could not be changed.");
  }
}

export async function addProjectImageAction(
  projectId: string,
  url: string,
  altText: string,
): Promise<ActionState> {
  const user = await assertAdmin();
  const parsed = projectImageSchema.safeParse({ projectId, url, altText });
  if (!parsed.success) return zodError(parsed.error);

  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { _count: { select: { images: true } } },
    });
    if (!project) return actionError("That project no longer exists.");
    if (project._count.images >= 12) {
      return actionError("A project can have up to 12 gallery images.");
    }

    const last = await db.projectImage.findFirst({
      where: { projectId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const image = await db.projectImage.create({
      data: {
        projectId,
        url: parsed.data.url,
        altText: parsed.data.altText,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPLOAD",
      entityType: "project-image",
      entityId: image.id,
      description: `Added a gallery image to “${project.title}”`,
    });
    refreshProjectPaths(project.slug);
    revalidatePath(`/admin/projects/${projectId}`);
    return actionSuccess("Gallery image added.");
  } catch (error) {
    console.error("[project-image-add]", error);
    return actionError("The gallery image could not be added.");
  }
}

export async function updateProjectImageAltAction(id: string, altText: string): Promise<ActionState> {
  const user = await assertAdmin();
  const clean = altText.trim();
  if (!clean) return actionError("Alt text is required.");
  if (clean.length > 300) return actionError("Keep alt text under 300 characters.");

  try {
    const image = await db.projectImage.findUnique({
      where: { id },
      include: { project: { select: { slug: true } } },
    });
    if (!image) return actionError("That gallery image no longer exists.");

    await db.projectImage.update({ where: { id }, data: { altText: clean } });
    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: "project-image",
      entityId: id,
      description: "Updated gallery image alt text",
    });
    refreshProjectPaths(image.project.slug);
    return actionSuccess("Alt text updated.");
  } catch (error) {
    console.error("[project-image-alt]", error);
    return actionError("The alt text could not be updated.");
  }
}

export async function deleteProjectImageAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const image = await db.projectImage.findUnique({
      where: { id },
      include: { project: { select: { slug: true } } },
    });
    if (!image) return actionError("That gallery image no longer exists.");

    await db.projectImage.delete({ where: { id } });
    await logActivity({
      userId: user.id,
      action: "DELETE",
      entityType: "project-image",
      entityId: id,
      description: "Deleted a project gallery image",
    });
    refreshProjectPaths(image.project.slug);
    return actionSuccess("Gallery image deleted.");
  } catch (error) {
    console.error("[project-image-delete]", error);
    return actionError("The gallery image could not be deleted.");
  }
}
