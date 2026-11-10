import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { AnalyticsTracker } from "@/components/analytics-tracker";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, profile] = await Promise.all([
    getSiteSettings(),
    db.profile.findFirst({ select: { displayName: true, title: true } }).catch(() => null),
  ]);
  const siteUrl = settings.siteUrl;
  const name = profile?.displayName || settings.siteName;
  const title = `${name} — ${profile?.title || "Full-Stack Developer & Software Engineer"}`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s · ${name}`,
    },
    description: settings.siteDescription,
    applicationName: settings.siteName,
    authors: [{ name }],
    creator: name,
    publisher: name,
    alternates: { canonical: siteUrl },
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title,
      description: settings.siteDescription,
      url: siteUrl,
      images: settings.defaultSocialImage ? [{ url: settings.defaultSocialImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: settings.siteDescription,
      images: settings.defaultSocialImage ? [settings.defaultSocialImage] : undefined,
    },
    verification: {
      google: settings.googleVerification || undefined,
      other: settings.bingVerification ? { "msvalidate.01": settings.bingVerification } : undefined,
    },
    icons: {
      icon: "/icon.svg",
      apple: "/icon.svg",
    },
    manifest: "/manifest.webmanifest",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#17171b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-foreground"
          >
            Skip to content
          </a>
          {children}
          <Toaster />
          <AnalyticsTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
