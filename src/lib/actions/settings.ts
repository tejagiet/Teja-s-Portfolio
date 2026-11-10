"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity";
import { assertAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import {
  actionError,
  actionSuccess,
  fdBool,
  fdOptional,
  fdString,
  settingsSchema,
  zodError,
  type ActionState,
} from "@/lib/validation";

export async function updateSettingsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();

  const parsed = settingsSchema.safeParse({
    siteName: fdString(formData, "siteName"),
    siteDescription: fdString(formData, "siteDescription"),
    siteUrl: fdString(formData, "siteUrl"),
    footerNote: fdOptional(formData, "footerNote"),
    contactEmail: fdString(formData, "contactEmail"),
    availabilityNote: fdOptional(formData, "availabilityNote"),
    defaultSocialImage: fdOptional(formData, "defaultSocialImage"),
    analyticsId: fdString(formData, "analyticsId"),
    googleVerification: fdOptional(formData, "googleVerification"),
    bingVerification: fdOptional(formData, "bingVerification"),
    resumePublicEnabled: fdBool(formData, "resumePublicEnabled"),
    maintenanceMode: fdBool(formData, "maintenanceMode"),
  });
  if (!parsed.success) return zodError(parsed.error);

  const data = parsed.data;
  try {
    await db.siteSetting.upsert({
      where: { id: "singleton" },
      update: {
        siteName: data.siteName,
        siteDescription: data.siteDescription,
        siteUrl: data.siteUrl.replace(/\/$/, ""),
        footerNote: data.footerNote || null,
        contactEmail: data.contactEmail || null,
        availabilityNote: data.availabilityNote || null,
        defaultSocialImage: data.defaultSocialImage || null,
        analyticsId: data.analyticsId || null,
        googleVerification: data.googleVerification || null,
        bingVerification: data.bingVerification || null,
        resumePublicEnabled: data.resumePublicEnabled,
        maintenanceMode: data.maintenanceMode,
      },
      create: {
        id: "singleton",
        siteName: data.siteName,
        siteDescription: data.siteDescription,
        siteUrl: data.siteUrl.replace(/\/$/, ""),
        footerNote: data.footerNote || null,
        contactEmail: data.contactEmail || null,
        availabilityNote: data.availabilityNote || null,
        defaultSocialImage: data.defaultSocialImage || null,
        analyticsId: data.analyticsId || null,
        googleVerification: data.googleVerification || null,
        bingVerification: data.bingVerification || null,
        resumePublicEnabled: data.resumePublicEnabled,
        maintenanceMode: data.maintenanceMode,
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: "settings",
      entityId: "singleton",
      description: "Updated website settings",
      metadata: { maintenanceMode: data.maintenanceMode },
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/sitemap.xml");
    revalidatePath("/robots.txt");
    return actionSuccess("Website settings saved.");
  } catch (error) {
    console.error("[settings-update]", error);
    return actionError("The settings could not be saved.");
  }
}
