import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [settings, profile] = await Promise.all([
    getSiteSettings(),
    db.profile.findFirst({ select: { displayName: true, title: true } }).catch(() => null),
  ]);
  const name = profile?.displayName || settings.siteName;

  return {
    name: `${name} — ${profile?.title || "Full-Stack Developer"}`,
    short_name: settings.siteName,
    description: settings.siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#4f46e5",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
