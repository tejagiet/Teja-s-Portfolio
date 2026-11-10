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
  fdNumber,
  fdOptional,
  fdString,
  skillCategorySchema,
  skillSchema,
  zodError,
  type ActionState,
} from "@/lib/validation";

function refreshSkillPaths() {
  revalidatePath("/");
  revalidatePath("/resume");
  revalidatePath("/admin");
  revalidatePath("/admin/skills");
}

async function uniqueCategorySlug(base: string, excludeId?: string) {
  const root = slugify(base) || `category-${Date.now()}`;
  let candidate = root;
  let suffix = 2;
  for (;;) {
    const clash = await db.skillCategory.findFirst({
      where: excludeId ? { slug: candidate, NOT: { id: excludeId } } : { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
}

export async function saveSkillCategoryAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const id = fdString(formData, "id");

  const parsed = skillCategorySchema.safeParse({
    name: fdString(formData, "name"),
    slug: fdOptional(formData, "slug"),
    description: fdOptional(formData, "description"),
    sortOrder: fdNumber(formData, "sortOrder", 0) ?? 0,
  });
  if (!parsed.success) return zodError(parsed.error);

  try {
    const slug = await uniqueCategorySlug(parsed.data.slug || parsed.data.name, id || undefined);
    if (id) {
      const existing = await db.skillCategory.findUnique({ where: { id } });
      if (!existing) return actionError("That category no longer exists.");
      await db.skillCategory.update({
        where: { id },
        data: {
          name: parsed.data.name,
          slug,
          description: parsed.data.description || null,
          sortOrder: parsed.data.sortOrder,
        },
      });
      await logActivity({
        userId: user.id,
        action: "UPDATE",
        entityType: "skill-category",
        entityId: id,
        description: `Updated skill category “${parsed.data.name}”`,
      });
    } else {
      const created = await db.skillCategory.create({
        data: {
          name: parsed.data.name,
          slug,
          description: parsed.data.description || null,
          sortOrder: parsed.data.sortOrder,
        },
      });
      await logActivity({
        userId: user.id,
        action: "CREATE",
        entityType: "skill-category",
        entityId: created.id,
        description: `Created skill category “${created.name}”`,
      });
    }

    await syncResumeState(user.id);
    refreshSkillPaths();
    return actionSuccess(id ? "Category saved." : "Category created.", {
      redirectTo: "/admin/skills",
    });
  } catch (error) {
    console.error("[skill-category-save]", error);
    return actionError("The category could not be saved.");
  }
}

export async function deleteSkillCategoryAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const category = await db.skillCategory.findUnique({
      where: { id },
      include: { _count: { select: { skills: true } } },
    });
    if (!category) return actionError("That category no longer exists.");

    await db.skillCategory.delete({ where: { id } });
    await syncResumeState(user.id);
    await logActivity({
      userId: user.id,
      action: "DELETE",
      entityType: "skill-category",
      entityId: id,
      description: `Deleted skill category “${category.name}” and ${category._count.skills} skills`,
    });
    refreshSkillPaths();
    return actionSuccess("Category deleted.");
  } catch (error) {
    console.error("[skill-category-delete]", error);
    return actionError("The category could not be deleted.");
  }
}

export async function saveSkillAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const id = fdString(formData, "id");

  const parsed = skillSchema.safeParse({
    categoryId: fdString(formData, "categoryId"),
    name: fdString(formData, "name"),
    level: fdNumber(formData, "level"),
    icon: fdOptional(formData, "icon"),
    sortOrder: fdNumber(formData, "sortOrder", 0) ?? 0,
    isVisible: fdBool(formData, "isVisible"),
  });
  if (!parsed.success) return zodError(parsed.error);

  try {
    const category = await db.skillCategory.findUnique({ where: { id: parsed.data.categoryId } });
    if (!category) return actionError("Choose a valid skill category.");

    const duplicate = await db.skill.findFirst({
      where: {
        categoryId: parsed.data.categoryId,
        name: parsed.data.name,
        ...(id ? { NOT: { id } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) return actionError("That skill already exists in the selected category.");

    const payload = {
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      level: parsed.data.level ?? null,
      icon: parsed.data.icon || null,
      sortOrder: parsed.data.sortOrder,
      isVisible: parsed.data.isVisible,
    };

    if (id) {
      const existing = await db.skill.findUnique({ where: { id } });
      if (!existing) return actionError("That skill no longer exists.");
      await db.skill.update({ where: { id }, data: payload });
      await logActivity({
        userId: user.id,
        action: "UPDATE",
        entityType: "skill",
        entityId: id,
        description: `Updated skill “${parsed.data.name}”`,
      });
    } else {
      const created = await db.skill.create({ data: payload });
      await logActivity({
        userId: user.id,
        action: "CREATE",
        entityType: "skill",
        entityId: created.id,
        description: `Added skill “${created.name}”`,
      });
    }

    await syncResumeState(user.id);
    refreshSkillPaths();
    return actionSuccess(id ? "Skill saved." : "Skill added.", {
      redirectTo: `/admin/skills?category=${parsed.data.categoryId}`,
    });
  } catch (error) {
    console.error("[skill-save]", error);
    return actionError("The skill could not be saved.");
  }
}

export async function deleteSkillAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const skill = await db.skill.findUnique({ where: { id } });
    if (!skill) return actionError("That skill no longer exists.");

    await db.skill.delete({ where: { id } });
    await syncResumeState(user.id);
    await logActivity({
      userId: user.id,
      action: "DELETE",
      entityType: "skill",
      entityId: id,
      description: `Deleted skill “${skill.name}”`,
    });
    refreshSkillPaths();
    return actionSuccess("Skill deleted.");
  } catch (error) {
    console.error("[skill-delete]", error);
    return actionError("The skill could not be deleted.");
  }
}

export async function toggleSkillVisibilityAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const skill = await db.skill.findUnique({ where: { id } });
    if (!skill) return actionError("That skill no longer exists.");

    const isVisible = !skill.isVisible;
    await db.skill.update({ where: { id }, data: { isVisible } });
    await syncResumeState(user.id);
    await logActivity({
      userId: user.id,
      action: isVisible ? "PUBLISH" : "UNPUBLISH",
      entityType: "skill",
      entityId: id,
      description: `${isVisible ? "Showed" : "Hid"} skill “${skill.name}”`,
    });
    refreshSkillPaths();
    return actionSuccess(isVisible ? "Skill is now visible." : "Skill is now hidden.");
  } catch (error) {
    console.error("[skill-toggle]", error);
    return actionError("The skill visibility could not be changed.");
  }
}
