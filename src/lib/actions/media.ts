"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity";
import { assertAdmin } from "@/lib/auth-guard";
import { deleteMediaAsset, uploadImage } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { syncResumeState } from "@/lib/resume-engine";
import { actionError, actionSuccess, fdString, type ActionState } from "@/lib/validation";

async function readFile(formData: FormData) {
  const entry = formData.get("file");
  if (!entry || typeof entry !== "object" || !("arrayBuffer" in entry)) {
    throw new Error("Choose an image to upload.");
  }
  const file = entry as File;
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("Images must be 25 MB or smaller.");
  }
  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type || "image/webp",
  };
}

export async function uploadMediaAction(formData: FormData): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const file = await readFile(formData);
    const folder = fdString(formData, "folder") || "media";
    const altText = fdString(formData, "alt") || null;
    const uploaded = await uploadImage(file.buffer, { folder, mimeType: file.mimeType });

    const asset = await db.mediaAsset.create({
      data: {
        publicId: uploaded.publicId,
        url: uploaded.url,
        secureUrl: uploaded.secureUrl,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        altText,
        folder,
        provider: uploaded.provider,
        uploadedById: user.id,
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPLOAD",
      entityType: "media",
      entityId: asset.id,
      description: `Uploaded an image to ${folder}`,
      metadata: { provider: uploaded.provider, bytes: uploaded.bytes },
    });

    revalidatePath("/admin/media");
    return actionSuccess("Image uploaded.", { asset, url: uploaded.secureUrl });
  } catch (error) {
    console.error("[upload]", error);
    return actionError(error instanceof Error ? error.message : "The upload failed.");
  }
}

/** Form-friendly wrapper used by the media library upload form. */
export async function uploadMediaFormAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return uploadMediaAction(formData);
}

export async function saveProfilePhotoAction(formData: FormData): Promise<ActionState> {
  const user = await assertAdmin();
  const kind = fdString(formData, "kind");
  if (!["profile", "about", "avatar"].includes(kind)) {
    return actionError("Unknown photo type.");
  }

  try {
    const file = await readFile(formData);
    const uploaded = await uploadImage(file.buffer, {
      folder: kind === "avatar" ? "admin-avatar" : "profile",
      mimeType: file.mimeType,
    });

    await db.mediaAsset.create({
      data: {
        publicId: uploaded.publicId,
        url: uploaded.url,
        secureUrl: uploaded.secureUrl,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        altText:
          kind === "avatar"
            ? `Admin avatar for ${user.name}`
            : `Portrait of ${user.profile?.displayName || user.name}`,
        folder: kind === "avatar" ? "admin-avatar" : "profile",
        provider: uploaded.provider,
        uploadedById: user.id,
      },
    });

    if (kind === "avatar") {
      await db.user.update({
        where: { id: user.id },
        data: { image: uploaded.secureUrl, previousImage: user.image },
      });
    } else {
      const profile = await db.profile.findFirst();
      if (!profile) return actionError("Create the public profile before adding photos.");
      await db.profile.update({
        where: { id: profile.id },
        data:
          kind === "profile"
            ? {
                profilePhotoUrl: uploaded.secureUrl,
                previousProfilePhotoUrl: profile.profilePhotoUrl,
              }
            : {
                aboutPhotoUrl: uploaded.secureUrl,
                previousAboutPhotoUrl: profile.aboutPhotoUrl,
              },
      });
      await syncResumeState(user.id);
    }

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: kind === "avatar" ? "account" : "profile",
      description:
        kind === "avatar"
          ? "Updated the admin avatar"
          : kind === "profile"
            ? "Updated the public profile photo"
            : "Updated the about photo",
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/account");
    revalidatePath("/admin/profile");
    return actionSuccess("Photo saved.", { url: uploaded.secureUrl });
  } catch (error) {
    console.error("[photo]", error);
    return actionError(error instanceof Error ? error.message : "The photo could not be saved.");
  }
}

export async function removeProfilePhotoAction(formData: FormData): Promise<ActionState> {
  const user = await assertAdmin();
  const kind = fdString(formData, "kind");

  try {
    if (kind === "avatar") {
      await db.user.update({
        where: { id: user.id },
        data: { previousImage: user.image, image: null },
      });
    } else {
      const profile = await db.profile.findFirst();
      if (!profile) return actionError("Profile not found.");
      await db.profile.update({
        where: { id: profile.id },
        data:
          kind === "profile"
            ? {
                previousProfilePhotoUrl: profile.profilePhotoUrl,
                profilePhotoUrl: null,
              }
            : {
                previousAboutPhotoUrl: profile.aboutPhotoUrl,
                aboutPhotoUrl: null,
              },
      });
      await syncResumeState(user.id);
    }

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: kind === "avatar" ? "account" : "profile",
      description: kind === "avatar" ? "Removed the admin avatar" : "Removed a profile photo",
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/account");
    revalidatePath("/admin/profile");
    return actionSuccess("Photo removed. You can restore the previous image if needed.");
  } catch (error) {
    console.error("[photo-remove]", error);
    return actionError("The photo could not be removed.");
  }
}

export async function restoreProfilePhotoAction(formData: FormData): Promise<ActionState> {
  const user = await assertAdmin();
  const kind = fdString(formData, "kind");

  try {
    if (kind === "avatar") {
      const fresh = await db.user.findUnique({ where: { id: user.id } });
      if (!fresh?.previousImage) return actionError("There is no previous avatar to restore.");
      await db.user.update({
        where: { id: user.id },
        data: { image: fresh.previousImage, previousImage: fresh.image },
      });
    } else {
      const profile = await db.profile.findFirst();
      if (!profile) return actionError("Profile not found.");
      const previous =
        kind === "profile" ? profile.previousProfilePhotoUrl : profile.previousAboutPhotoUrl;
      if (!previous) return actionError("There is no previous image to restore.");
      await db.profile.update({
        where: { id: profile.id },
        data:
          kind === "profile"
            ? { profilePhotoUrl: previous, previousProfilePhotoUrl: profile.profilePhotoUrl }
            : { aboutPhotoUrl: previous, previousAboutPhotoUrl: profile.aboutPhotoUrl },
      });
      await syncResumeState(user.id);
    }

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: kind === "avatar" ? "account" : "profile",
      description: kind === "avatar" ? "Restored the previous admin avatar" : "Restored a previous profile photo",
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/account");
    revalidatePath("/admin/profile");
    return actionSuccess("Previous photo restored.");
  } catch (error) {
    console.error("[photo-restore]", error);
    return actionError("The previous photo could not be restored.");
  }
}

export async function updateMediaAltAction(id: string, altText: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) return actionError("Media asset not found.");
    await db.mediaAsset.update({
      where: { id },
      data: { altText: altText.trim().slice(0, 300) || null },
    });
    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: "media",
      entityId: id,
      description: "Updated media alt text",
    });
    revalidatePath("/admin/media");
    return actionSuccess("Alt text updated.");
  } catch (error) {
    console.error("[media-alt]", error);
    return actionError("Alt text could not be updated.");
  }
}

export async function deleteMediaAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) return actionError("Media asset not found.");

    await db.mediaAsset.delete({ where: { id } });
    await deleteMediaAsset(asset.provider, asset.publicId);

    await logActivity({
      userId: user.id,
      action: "DELETE",
      entityType: "media",
      entityId: id,
      description: "Deleted a media asset",
      metadata: { provider: asset.provider },
    });
    revalidatePath("/admin/media");
    return actionSuccess("Media asset deleted.");
  } catch (error) {
    console.error("[media-delete]", error);
    return actionError("The media asset could not be deleted.");
  }
}

/**
 * Re-uses an existing photo from the media library as profile photo, about photo, or avatar.
 */
export async function selectExistingProfilePhotoAction(
  kind: "profile" | "about" | "avatar",
  url: string,
): Promise<ActionState> {
  const user = await assertAdmin();
  if (!url) return actionError("No image URL provided.");

  try {
    if (kind === "avatar") {
      await db.user.update({
        where: { id: user.id },
        data: { image: url, previousImage: user.image },
      });
    } else {
      const profile = await db.profile.findFirst();
      if (!profile) return actionError("Profile not found.");
      await db.profile.update({
        where: { id: profile.id },
        data:
          kind === "profile"
            ? {
                profilePhotoUrl: url,
                previousProfilePhotoUrl: profile.profilePhotoUrl,
              }
            : {
                aboutPhotoUrl: url,
                previousAboutPhotoUrl: profile.aboutPhotoUrl,
              },
      });
      await syncResumeState(user.id);
    }

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: kind === "avatar" ? "account" : "profile",
      description:
        kind === "avatar"
          ? "Selected existing image for admin avatar"
          : kind === "profile"
            ? "Selected existing image for public profile photo"
            : "Selected existing image for about section photo",
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/account");
    revalidatePath("/admin/profile");
    return actionSuccess("Photo updated from media library.", { url });
  } catch (error) {
    console.error("[selectProfilePhoto]", error);
    return actionError(error instanceof Error ? error.message : "Failed to update photo.");
  }
}

/**
 * Fetches all media assets for the MediaPicker modal so users can reuse photos across sections.
 */
export async function getMediaAssetsAction(): Promise<{
  id: string;
  url: string;
  secureUrl: string;
  altText: string | null;
  folder: string;
  width: number | null;
  height: number | null;
  format: string | null;
  createdAt: string;
}[]> {
  await assertAdmin();
  const assets = await db.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
    select: {
      id: true,
      url: true,
      secureUrl: true,
      altText: true,
      folder: true,
      width: true,
      height: true,
      format: true,
      createdAt: true,
    },
  });
  return assets.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));
}
