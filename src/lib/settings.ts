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

function resolveFallbackSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export const defaultSettings: PublicSettings = {
  id: "singleton",
  siteName: "Teja Manikanta",
  siteDescription:
    "Portfolio of Teja Manikanta, a full-stack developer and engineering student focused on web applications, backend systems, databases and cloud solutions.",
  siteUrl: resolveFallbackSiteUrl(),
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
      siteUrl: (settings.siteUrl || resolveFallbackSiteUrl()).replace(/\/$/, ""),
    };
  } catch (error) {
    console.error("[settings]", error);
    return defaultSettings;
  }
}

export function siteUrlFromEnv() {
  return resolveFallbackSiteUrl();
}
