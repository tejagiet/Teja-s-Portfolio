import "server-only";

import { db } from "@/lib/db";

export type PublicSettings = {
  id: string;
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  footerNote: string | null;
  contactEmail: string | null;
  availabilityNote: string | null;
  defaultSocialImage: string | null;
  analyticsId: string | null;
  googleVerification: string | null;
  bingVerification: string | null;
  resumePublicEnabled: boolean;
  maintenanceMode: boolean;
  updatedAt: Date;
};

export const defaultSettings: PublicSettings = {
  id: "singleton",
  siteName: "Teja Manikanta",
  siteDescription:
    "Portfolio of Teja Manikanta, a full-stack developer and engineering student focused on web applications, backend systems, databases and cloud solutions.",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  footerNote: null,
  contactEmail: null,
  availabilityNote: null,
  defaultSocialImage: null,
  analyticsId: null,
  googleVerification: null,
  bingVerification: null,
  resumePublicEnabled: true,
  maintenanceMode: false,
  updatedAt: new Date(0),
};

export async function getSiteSettings(): Promise<PublicSettings> {
  try {
    const settings = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (!settings) return defaultSettings;
    return {
      ...settings,
      siteUrl: (settings.siteUrl || defaultSettings.siteUrl).replace(/\/$/, ""),
    };
  } catch (error) {
    console.error("[settings]", error);
    return defaultSettings;
  }
}

export function siteUrlFromEnv() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
