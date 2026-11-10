"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity";
import { assertAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { syncResumeState } from "@/lib/resume-engine";
import {
  actionError,
  actionSuccess,
  fdBool,
  fdList,
  fdOptional,
  fdString,
  profileSchema,
  socialLinkSchema,
  zodError,
  type ActionState,
} from "@/lib/validation";

function refreshProfilePaths() {
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/profile");
  revalidatePath("/resume");
}

export async function updateProfileAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();

  const parsed = profileSchema.safeParse({
    displayName: fdString(formData, "displayName"),
    title: fdString(formData, "title"),
    tagline: fdOptional(formData, "tagline"),
    shortBio: fdOptional(formData, "shortBio"),
    about: fdString(formData, "about"),
    email: fdString(formData, "email"),
    phone: fdOptional(formData, "phone"),
    location: fdOptional(formData, "location"),
    availability: fdOptional(formData, "availability"),
    resumeSummary: fdOptional(formData, "resumeSummary"),
    interests: fdList(formData, "interests"),
  });
  if (!parsed.success) return zodError(parsed.error);

  try {
    const profile = await db.profile.findFirst();
    if (!profile) return actionError("No profile exists yet. Reload the page and try again.");

    const data = parsed.data;
    await db.profile.update({
      where: { id: profile.id },
      // Photo fields are intentionally excluded: they are saved immediately by
      // the photo manager and must not be overwritten by stale form values.
      data: {
        displayName: data.displayName,
        title: data.title,
        tagline: data.tagline || null,
        shortBio: data.shortBio || null,
        about: data.about,
        email: data.email || null,
        phone: data.phone || null,
        location: data.location || null,
        availability: data.availability || null,
        resumeSummary: data.resumeSummary || null,
        interests: data.interests,
      },
    });

    await syncResumeState(user.id);
    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: "profile",
      entityId: profile.id,
      description: "Updated the public profile",
    });

    refreshProfilePaths();
    return actionSuccess("Profile saved.");
  } catch (error) {
    console.error("[profile-update]", error);
    return actionError("The profile could not be saved.");
  }
}

export async function saveSocialLinkAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const id = fdString(formData, "id");

  const parsed = socialLinkSchema.safeParse({
    platform: fdString(formData, "platform"),
    label: fdString(formData, "label"),
    url: fdString(formData, "url"),
    icon: fdOptional(formData, "icon"),
    sortOrder: Number(fdString(formData, "sortOrder") || 0),
    isVisible: fdBool(formData, "isVisible"),
  });
  if (!parsed.success) return zodError(parsed.error);

  try {
    const profile = await db.profile.findFirst();
    if (!profile) return actionError("Create the public profile before adding links.");

    if (id) {
      const existing = await db.socialLink.findFirst({ where: { id, profileId: profile.id } });
      if (!existing) return actionError("That social link no longer exists.");
      await db.socialLink.update({ where: { id }, data: parsed.data });
      await logActivity({
        userId: user.id,
        action: "UPDATE",
        entityType: "social-link",
        entityId: id,
        description: `Updated the ${parsed.data.label} link`,
      });
    } else {
      const created = await db.socialLink.create({
        data: { ...parsed.data, profileId: profile.id },
      });
      await logActivity({
        userId: user.id,
        action: "CREATE",
        entityType: "social-link",
        entityId: created.id,
        description: `Added the ${created.label} link`,
      });
    }

    await syncResumeState(user.id);
    refreshProfilePaths();
    return actionSuccess(id ? "Link updated." : "Link added.", {
      redirectTo: "/admin/profile",
    });
  } catch (error) {
    console.error("[social-save]", error);
    return actionError("The social link could not be saved.");
  }
}

export async function deleteSocialLinkAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const link = await db.socialLink.findUnique({ where: { id } });
    if (!link) return actionError("That social link no longer exists.");

    await db.socialLink.delete({ where: { id } });
    await syncResumeState(user.id);
    await logActivity({
      userId: user.id,
      action: "DELETE",
      entityType: "social-link",
      entityId: id,
      description: `Deleted the ${link.label} link`,
    });
    refreshProfilePaths();
    return actionSuccess("Link deleted.");
  } catch (error) {
    console.error("[social-delete]", error);
    return actionError("The social link could not be deleted.");
  }
}

export async function toggleSocialLinkAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const link = await db.socialLink.findUnique({ where: { id } });
    if (!link) return actionError("That social link no longer exists.");

    const isVisible = !link.isVisible;
    await db.socialLink.update({ where: { id }, data: { isVisible } });
    await syncResumeState(user.id);
    await logActivity({
      userId: user.id,
      action: isVisible ? "PUBLISH" : "UNPUBLISH",
      entityType: "social-link",
      entityId: id,
      description: `${isVisible ? "Showed" : "Hid"} the ${link.label} link`,
    });
    refreshProfilePaths();
    return actionSuccess(isVisible ? "Link is now visible." : "Link is now hidden.");
  } catch (error) {
    console.error("[social-toggle]", error);
    return actionError("The link visibility could not be changed.");
  }
}
