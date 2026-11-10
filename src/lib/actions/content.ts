"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity";
import { assertAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { syncResumeState } from "@/lib/resume-engine";
import {
  achievementSchema,
  actionError,
  actionSuccess,
  certificationSchema,
  educationSchema,
  experienceSchema,
  fdBool,
  fdDate,
  fdList,
  fdNumber,
  fdOptional,
  fdString,
  serviceSchema,
  zodError,
  type ActionState,
} from "@/lib/validation";

function refreshContentPaths(adminPath: string) {
  revalidatePath("/");
  revalidatePath("/resume");
  revalidatePath("/admin");
  revalidatePath(adminPath);
}

async function syncAndLog(
  userId: string,
  action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "UNPUBLISH",
  entityType: string,
  entityId: string,
  description: string,
  adminPath: string,
) {
  await syncResumeState(userId);
  await logActivity({ userId, action, entityType, entityId, description });
  refreshContentPaths(adminPath);
}

/* ---------------------------------- Experience --------------------------------- */

export async function saveExperienceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const id = fdString(formData, "id");

  const parsed = experienceSchema.safeParse({
    role: fdString(formData, "role"),
    organization: fdString(formData, "organization"),
    type: fdString(formData, "type"),
    location: fdOptional(formData, "location"),
    startDate: fdDate(formData, "startDate"),
    endDate: fdDate(formData, "endDate"),
    isCurrent: fdBool(formData, "isCurrent"),
    description: fdString(formData, "description"),
    highlights: fdList(formData, "highlights"),
    sortOrder: fdNumber(formData, "sortOrder", 0) ?? 0,
    published: fdBool(formData, "published"),
  });
  if (!parsed.success) return zodError(parsed.error);

  const data = parsed.data;
  if (!data.startDate) return actionError("Enter a start date.");
  if (!data.isCurrent && data.endDate && data.endDate < data.startDate) {
    return actionError("The end date cannot be before the start date.");
  }

  try {
    const payload = {
      role: data.role,
      organization: data.organization,
      type: data.type,
      location: data.location || null,
      startDate: data.startDate,
      endDate: data.isCurrent ? null : data.endDate ?? null,
      isCurrent: data.isCurrent,
      description: data.description,
      highlights: data.highlights,
      sortOrder: data.sortOrder,
      published: data.published,
    };

    let entityId = id;
    if (id) {
      const existing = await db.experience.findUnique({ where: { id } });
      if (!existing) return actionError("That experience entry no longer exists.");
      await db.experience.update({ where: { id }, data: payload });
      await syncAndLog(
        user.id,
        "UPDATE",
        "experience",
        id,
        `Updated experience “${data.role} at ${data.organization}”`,
        "/admin/experience",
      );
    } else {
      const created = await db.experience.create({ data: payload });
      entityId = created.id;
      await syncAndLog(
        user.id,
        "CREATE",
        "experience",
        created.id,
        `Added experience “${data.role} at ${data.organization}”`,
        "/admin/experience",
      );
    }

    return actionSuccess(id ? "Experience saved." : "Experience added.", {
      redirectTo: `/admin/experience?edit=${entityId}`,
    });
  } catch (error) {
    console.error("[experience-save]", error);
    return actionError("The experience entry could not be saved.");
  }
}

export async function deleteExperienceAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const entry = await db.experience.findUnique({ where: { id } });
    if (!entry) return actionError("That experience entry no longer exists.");
    await db.experience.delete({ where: { id } });
    await syncAndLog(
      user.id,
      "DELETE",
      "experience",
      id,
      `Deleted experience “${entry.role} at ${entry.organization}”`,
      "/admin/experience",
    );
    return actionSuccess("Experience entry deleted.");
  } catch (error) {
    console.error("[experience-delete]", error);
    return actionError("The experience entry could not be deleted.");
  }
}

export async function toggleExperiencePublishedAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const entry = await db.experience.findUnique({ where: { id } });
    if (!entry) return actionError("That experience entry no longer exists.");
    const published = !entry.published;
    await db.experience.update({ where: { id }, data: { published } });
    await syncAndLog(
      user.id,
      published ? "PUBLISH" : "UNPUBLISH",
      "experience",
      id,
      `${published ? "Published" : "Unpublished"} experience “${entry.role}”`,
      "/admin/experience",
    );
    return actionSuccess(published ? "Experience published." : "Experience moved to drafts.");
  } catch (error) {
    console.error("[experience-toggle]", error);
    return actionError("The visibility could not be changed.");
  }
}

/* ---------------------------------- Education ---------------------------------- */

export async function saveEducationAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const id = fdString(formData, "id");

  const parsed = educationSchema.safeParse({
    institution: fdString(formData, "institution"),
    degree: fdString(formData, "degree"),
    field: fdOptional(formData, "field"),
    location: fdOptional(formData, "location"),
    startYear: fdNumber(formData, "startYear"),
    endYear: fdNumber(formData, "endYear"),
    isCurrent: fdBool(formData, "isCurrent"),
    grade: fdOptional(formData, "grade"),
    description: fdOptional(formData, "description"),
    sortOrder: fdNumber(formData, "sortOrder", 0) ?? 0,
    published: fdBool(formData, "published"),
  });
  if (!parsed.success) return zodError(parsed.error);

  const data = parsed.data;
  if (data.startYear && data.endYear && data.endYear < data.startYear) {
    return actionError("The end year cannot be before the start year.");
  }

  try {
    const payload = {
      institution: data.institution,
      degree: data.degree,
      field: data.field || null,
      location: data.location || null,
      startYear: data.startYear ?? null,
      endYear: data.endYear ?? null,
      isCurrent: data.isCurrent,
      grade: data.grade || null,
      description: data.description || null,
      sortOrder: data.sortOrder,
      published: data.published,
    };

    let entityId = id;
    if (id) {
      const existing = await db.education.findUnique({ where: { id } });
      if (!existing) return actionError("That education entry no longer exists.");
      await db.education.update({ where: { id }, data: payload });
      await syncAndLog(
        user.id,
        "UPDATE",
        "education",
        id,
        `Updated education “${data.degree}”`,
        "/admin/education",
      );
    } else {
      const created = await db.education.create({ data: payload });
      entityId = created.id;
      await syncAndLog(
        user.id,
        "CREATE",
        "education",
        created.id,
        `Added education “${data.degree}”`,
        "/admin/education",
      );
    }

    return actionSuccess(id ? "Education saved." : "Education added.", {
      redirectTo: `/admin/education?edit=${entityId}`,
    });
  } catch (error) {
    console.error("[education-save]", error);
    return actionError("The education entry could not be saved.");
  }
}

export async function deleteEducationAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const entry = await db.education.findUnique({ where: { id } });
    if (!entry) return actionError("That education entry no longer exists.");
    await db.education.delete({ where: { id } });
    await syncAndLog(
      user.id,
      "DELETE",
      "education",
      id,
      `Deleted education “${entry.degree}”`,
      "/admin/education",
    );
    return actionSuccess("Education entry deleted.");
  } catch (error) {
    console.error("[education-delete]", error);
    return actionError("The education entry could not be deleted.");
  }
}

export async function toggleEducationPublishedAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const entry = await db.education.findUnique({ where: { id } });
    if (!entry) return actionError("That education entry no longer exists.");
    const published = !entry.published;
    await db.education.update({ where: { id }, data: { published } });
    await syncAndLog(
      user.id,
      published ? "PUBLISH" : "UNPUBLISH",
      "education",
      id,
      `${published ? "Published" : "Unpublished"} education “${entry.degree}”`,
      "/admin/education",
    );
    return actionSuccess(published ? "Education published." : "Education moved to drafts.");
  } catch (error) {
    console.error("[education-toggle]", error);
    return actionError("The visibility could not be changed.");
  }
}

/* -------------------------------- Certifications ------------------------------- */

export async function saveCertificationAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const id = fdString(formData, "id");

  const parsed = certificationSchema.safeParse({
    title: fdString(formData, "title"),
    issuer: fdString(formData, "issuer"),
    issueDate: fdDate(formData, "issueDate"),
    expiryDate: fdDate(formData, "expiryDate"),
    credentialId: fdOptional(formData, "credentialId"),
    credentialUrl: fdOptional(formData, "credentialUrl"),
    imageUrl: fdOptional(formData, "imageUrl"),
    sortOrder: fdNumber(formData, "sortOrder", 0) ?? 0,
    published: fdBool(formData, "published"),
  });
  if (!parsed.success) return zodError(parsed.error);

  const data = parsed.data;
  if (data.issueDate && data.expiryDate && data.expiryDate < data.issueDate) {
    return actionError("The expiry date cannot be before the issue date.");
  }

  try {
    const payload = {
      title: data.title,
      issuer: data.issuer,
      issueDate: data.issueDate ?? null,
      expiryDate: data.expiryDate ?? null,
      credentialId: data.credentialId || null,
      credentialUrl: data.credentialUrl || null,
      imageUrl: data.imageUrl || null,
      sortOrder: data.sortOrder,
      published: data.published,
    };

    let entityId = id;
    if (id) {
      const existing = await db.certification.findUnique({ where: { id } });
      if (!existing) return actionError("That certification no longer exists.");
      await db.certification.update({ where: { id }, data: payload });
      await syncAndLog(
        user.id,
        "UPDATE",
        "certification",
        id,
        `Updated certification “${data.title}”`,
        "/admin/certifications",
      );
    } else {
      const created = await db.certification.create({ data: payload });
      entityId = created.id;
      await syncAndLog(
        user.id,
        "CREATE",
        "certification",
        created.id,
        `Added certification “${data.title}”`,
        "/admin/certifications",
      );
    }

    return actionSuccess(id ? "Certification saved." : "Certification added.", {
      redirectTo: `/admin/certifications?edit=${entityId}`,
    });
  } catch (error) {
    console.error("[certification-save]", error);
    return actionError("The certification could not be saved.");
  }
}

export async function deleteCertificationAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const entry = await db.certification.findUnique({ where: { id } });
    if (!entry) return actionError("That certification no longer exists.");
    await db.certification.delete({ where: { id } });
    await syncAndLog(
      user.id,
      "DELETE",
      "certification",
      id,
      `Deleted certification “${entry.title}”`,
      "/admin/certifications",
    );
    return actionSuccess("Certification deleted.");
  } catch (error) {
    console.error("[certification-delete]", error);
    return actionError("The certification could not be deleted.");
  }
}

export async function toggleCertificationPublishedAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const entry = await db.certification.findUnique({ where: { id } });
    if (!entry) return actionError("That certification no longer exists.");
    const published = !entry.published;
    await db.certification.update({ where: { id }, data: { published } });
    await syncAndLog(
      user.id,
      published ? "PUBLISH" : "UNPUBLISH",
      "certification",
      id,
      `${published ? "Published" : "Unpublished"} certification “${entry.title}”`,
      "/admin/certifications",
    );
    return actionSuccess(published ? "Certification published." : "Certification moved to drafts.");
  } catch (error) {
    console.error("[certification-toggle]", error);
    return actionError("The visibility could not be changed.");
  }
}

/* ----------------------------------- Services ---------------------------------- */

export async function saveServiceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const id = fdString(formData, "id");

  const parsed = serviceSchema.safeParse({
    title: fdString(formData, "title"),
    description: fdString(formData, "description"),
    icon: fdOptional(formData, "icon"),
    features: fdList(formData, "features"),
    priceNote: fdOptional(formData, "priceNote"),
    sortOrder: fdNumber(formData, "sortOrder", 0) ?? 0,
    published: fdBool(formData, "published"),
  });
  if (!parsed.success) return zodError(parsed.error);

  const data = parsed.data;
  try {
    const payload = {
      title: data.title,
      description: data.description,
      icon: data.icon || null,
      features: data.features,
      priceNote: data.priceNote || null,
      sortOrder: data.sortOrder,
      published: data.published,
    };

    let entityId = id;
    if (id) {
      const existing = await db.service.findUnique({ where: { id } });
      if (!existing) return actionError("That service no longer exists.");
      await db.service.update({ where: { id }, data: payload });
      await logActivity({
        userId: user.id,
        action: "UPDATE",
        entityType: "service",
        entityId: id,
        description: `Updated service “${data.title}”`,
      });
    } else {
      const created = await db.service.create({ data: payload });
      entityId = created.id;
      await logActivity({
        userId: user.id,
        action: "CREATE",
        entityType: "service",
        entityId: created.id,
        description: `Added service “${data.title}”`,
      });
    }

    refreshContentPaths("/admin/services");
    return actionSuccess(id ? "Service saved." : "Service added.", {
      redirectTo: `/admin/services?edit=${entityId}`,
    });
  } catch (error) {
    console.error("[service-save]", error);
    return actionError("The service could not be saved.");
  }
}

export async function deleteServiceAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const entry = await db.service.findUnique({ where: { id } });
    if (!entry) return actionError("That service no longer exists.");
    await db.service.delete({ where: { id } });
    await logActivity({
      userId: user.id,
      action: "DELETE",
      entityType: "service",
      entityId: id,
      description: `Deleted service “${entry.title}”`,
    });
    refreshContentPaths("/admin/services");
    return actionSuccess("Service deleted.");
  } catch (error) {
    console.error("[service-delete]", error);
    return actionError("The service could not be deleted.");
  }
}

export async function toggleServicePublishedAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const entry = await db.service.findUnique({ where: { id } });
    if (!entry) return actionError("That service no longer exists.");
    const published = !entry.published;
    await db.service.update({ where: { id }, data: { published } });
    await logActivity({
      userId: user.id,
      action: published ? "PUBLISH" : "UNPUBLISH",
      entityType: "service",
      entityId: id,
      description: `${published ? "Published" : "Unpublished"} service “${entry.title}”`,
    });
    refreshContentPaths("/admin/services");
    return actionSuccess(published ? "Service published." : "Service moved to drafts.");
  } catch (error) {
    console.error("[service-toggle]", error);
    return actionError("The visibility could not be changed.");
  }
}

/* --------------------------------- Achievements -------------------------------- */

export async function saveAchievementAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const id = fdString(formData, "id");

  const parsed = achievementSchema.safeParse({
    title: fdString(formData, "title"),
    description: fdString(formData, "description"),
    date: fdDate(formData, "date"),
    icon: fdOptional(formData, "icon"),
    sortOrder: fdNumber(formData, "sortOrder", 0) ?? 0,
    published: fdBool(formData, "published"),
  });
  if (!parsed.success) return zodError(parsed.error);

  const data = parsed.data;
  try {
    const payload = {
      title: data.title,
      description: data.description,
      date: data.date ?? null,
      icon: data.icon || null,
      sortOrder: data.sortOrder,
      published: data.published,
    };

    let entityId = id;
    if (id) {
      const existing = await db.achievement.findUnique({ where: { id } });
      if (!existing) return actionError("That achievement no longer exists.");
      await db.achievement.update({ where: { id }, data: payload });
      await syncAndLog(
        user.id,
        "UPDATE",
        "achievement",
        id,
        `Updated achievement “${data.title}”`,
        "/admin/achievements",
      );
    } else {
      const created = await db.achievement.create({ data: payload });
      entityId = created.id;
      await syncAndLog(
        user.id,
        "CREATE",
        "achievement",
        created.id,
        `Added achievement “${data.title}”`,
        "/admin/achievements",
      );
    }

    return actionSuccess(id ? "Achievement saved." : "Achievement added.", {
      redirectTo: `/admin/achievements?edit=${entityId}`,
    });
  } catch (error) {
    console.error("[achievement-save]", error);
    return actionError("The achievement could not be saved.");
  }
}

export async function deleteAchievementAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const entry = await db.achievement.findUnique({ where: { id } });
    if (!entry) return actionError("That achievement no longer exists.");
    await db.achievement.delete({ where: { id } });
    await syncAndLog(
      user.id,
      "DELETE",
      "achievement",
      id,
      `Deleted achievement “${entry.title}”`,
      "/admin/achievements",
    );
    return actionSuccess("Achievement deleted.");
  } catch (error) {
    console.error("[achievement-delete]", error);
    return actionError("The achievement could not be deleted.");
  }
}

export async function toggleAchievementPublishedAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const entry = await db.achievement.findUnique({ where: { id } });
    if (!entry) return actionError("That achievement no longer exists.");
    const published = !entry.published;
    await db.achievement.update({ where: { id }, data: { published } });
    await syncAndLog(
      user.id,
      published ? "PUBLISH" : "UNPUBLISH",
      "achievement",
      id,
      `${published ? "Published" : "Unpublished"} achievement “${entry.title}”`,
      "/admin/achievements",
    );
    return actionSuccess(published ? "Achievement published." : "Achievement moved to drafts.");
  } catch (error) {
    console.error("[achievement-toggle]", error);
    return actionError("The visibility could not be changed.");
  }
}
