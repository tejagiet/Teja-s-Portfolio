import "server-only";

import type { Metadata } from "next";

import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { truncate } from "@/lib/utils";

type PageMetadataInput = {
  pageKey: string;
  path: string;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackImage?: string | null;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
  keywords?: string[];
};

function absolute(path: string, base: string) {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function getSeoForPage(pageKey: string) {
  return db.seoMetadata.findUnique({ where: { pageKey } });
}

export async function buildPageMetadata(input: PageMetadataInput): Promise<Metadata> {
  const [settings, seo] = await Promise.all([
    getSiteSettings(),
    getSeoForPage(input.pageKey).catch(() => null),
  ]);

  const title = seo?.title?.trim() || input.fallbackTitle;
  const description = seo?.description?.trim() || input.fallbackDescription;
  const canonical = seo?.canonicalUrl?.trim() || absolute(input.path, settings.siteUrl);
  const image = seo?.ogImageUrl || input.fallbackImage || settings.defaultSocialImage || undefined;

  return {
    title,
    description,
    keywords: seo?.keywords?.length ? seo.keywords : input.keywords,
    alternates: { canonical },
    robots: seo?.noIndex || input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: input.type ?? "website",
      url: canonical,
      siteName: settings.siteName,
      title,
      description,
      images: image ? [{ url: image, alt: settings.siteName }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function projectDescription(description: string | null | undefined, fallback: string) {
  const value = (description || "").replace(/\s+/g, " ").trim();
  return value ? truncate(value, 158) : fallback;
}

export async function getVerificationMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    other: {
      ...(settings.googleVerification
        ? { "google-site-verification": settings.googleVerification }
        : {}),
      ...(settings.bingVerification ? { "msvalidate.01": settings.bingVerification } : {}),
    },
  };
}

export function personJsonLd(input: {
  name: string;
  title: string;
  description: string;
  url: string;
  image?: string | null;
  email?: string | null;
  sameAs: string[];
  location?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    jobTitle: input.title,
    description: input.description,
    url: input.url,
    image: input.image || undefined,
    email: input.email ? `mailto:${input.email}` : undefined,
    address: input.location
      ? { "@type": "PostalAddress", addressLocality: input.location }
      : undefined,
    sameAs: input.sameAs.length ? input.sameAs : undefined,
    knowsAbout: [
      "Full-stack development",
      "Backend engineering",
      "API development",
      "Database architecture",
      "Cloud infrastructure",
      "Artificial intelligence",
      "Android development",
    ],
  };
}

export function websiteJsonLd(name: string, url: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description,
  };
}

export function profilePageJsonLd(name: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name,
      url,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
