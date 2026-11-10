import "server-only";

import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

export type SeoIssue = {
  severity: "critical" | "warning" | "info";
  code: string;
  message: string;
  href?: string;
};

export type SeoCheck = {
  label: string;
  ok: boolean;
  detail: string;
  href?: string;
};

export type SeoAudit = {
  score: number;
  issues: SeoIssue[];
  checks: SeoCheck[];
  stats: {
    pages: number;
    publishedProjects: number;
    indexedPages: number;
    missingAlt: number;
    brokenLinks: number;
    duplicateTitles: number;
  };
};

const STATIC_PAGES = [
  { key: "home", path: "/", label: "Home" },
  { key: "projects", path: "/projects", label: "Projects" },
  { key: "resume", path: "/resume", label: "Resume" },
  { key: "contact", path: "/contact", label: "Contact" },
];

export async function runSeoAudit(): Promise<SeoAudit> {
  const [settings, seoEntries, projects, projectImages, media, redirects] =
    await Promise.all([
      getSiteSettings(),
      db.seoMetadata.findMany(),
      db.project.findMany({
        where: { published: true },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          content: true,
          coverImageUrl: true,
          coverImageAlt: true,
        },
      }),
      db.projectImage.findMany({
        select: { url: true, altText: true, project: { select: { slug: true } } },
      }),
      db.mediaAsset.findMany({ select: { url: true, altText: true } }),
      db.redirect.findMany({ select: { source: true, destination: true } }),
    ]);

  const issues: SeoIssue[] = [];
  const checks: SeoCheck[] = [];
  const byKey = new Map(seoEntries.map((entry) => [entry.pageKey, entry]));

  // Static page metadata
  for (const page of STATIC_PAGES) {
    const seo = byKey.get(page.key);
    if (!seo) {
      issues.push({
        severity: "critical",
        code: `missing-metadata-${page.key}`,
        message: `${page.label} page has no managed SEO metadata.`,
        href: `/admin/seo?page=${page.key}`,
      });
      continue;
    }
    if (!seo.title.trim()) {
      issues.push({
        severity: "critical",
        code: `missing-title-${page.key}`,
        message: `${page.label} page is missing a title.`,
        href: `/admin/seo?page=${page.key}`,
      });
    } else if (seo.title.length > 60) {
      issues.push({
        severity: "info",
        code: `long-title-${page.key}`,
        message: `${page.label} title is ${seo.title.length} characters. Search results may truncate it.`,
        href: `/admin/seo?page=${page.key}`,
      });
    }
    if (!seo.description.trim()) {
      issues.push({
        severity: "critical",
        code: `missing-description-${page.key}`,
        message: `${page.label} page is missing a meta description.`,
        href: `/admin/seo?page=${page.key}`,
      });
    } else if (seo.description.length < 50 || seo.description.length > 170) {
      issues.push({
        severity: "info",
        code: `description-length-${page.key}`,
        message: `${page.label} description is ${seo.description.length} characters. Aim for 50–160.`,
        href: `/admin/seo?page=${page.key}`,
      });
    }
  }

  // Duplicate titles
  const titleCounts = new Map<string, number>();
  for (const entry of seoEntries) {
    if (!entry.title) continue;
    const key = entry.title.trim().toLowerCase();
    titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
  }
  const duplicateTitles = Array.from(titleCounts.values()).filter((count) => count > 1).length;
  if (duplicateTitles > 0) {
    issues.push({
      severity: "warning",
      code: "duplicate-titles",
      message: `${duplicateTitles} duplicate page title${duplicateTitles === 1 ? "" : "s"} detected.`,
      href: "/admin/seo",
    });
  }

  // Missing alt text
  const missingProjectCoverAlt = projects.filter(
    (project) => project.coverImageUrl && !project.coverImageAlt?.trim(),
  );
  const missingGalleryAlt = projectImages.filter((image) => !image.altText?.trim());
  const missingMediaAlt = media.filter((asset) => !asset.altText?.trim());
  const missingAlt =
    missingProjectCoverAlt.length + missingGalleryAlt.length + missingMediaAlt.length;

  if (missingProjectCoverAlt.length) {
    for (const project of missingProjectCoverAlt) {
      issues.push({
        severity: "warning",
        code: "missing-cover-alt",
        message: `Project “${project.title}” has a cover image without alt text.`,
        href: `/admin/projects/${project.id}`,
      });
    }
  }
  if (missingGalleryAlt.length) {
    issues.push({
      severity: "warning",
      code: "missing-gallery-alt",
      message: `${missingGalleryAlt.length} project gallery image${missingGalleryAlt.length === 1 ? "" : "s"} missing alt text.`,
      href: "/admin/projects",
    });
  }
  if (missingMediaAlt.length) {
    issues.push({
      severity: "info",
      code: "media-alt",
      message: `${missingMediaAlt.length} media asset${missingMediaAlt.length === 1 ? "" : "s"} without alt text (only required once used in content).`,
      href: "/admin/media",
    });
  }

  // Broken internal links in project content
  const knownPaths = new Set<string>([
    ...STATIC_PAGES.map((page) => page.path),
    ...projects.map((project) => `/projects/${project.slug}`),
    ...redirects.map((redirect) => redirect.source),
    "/projects",
  ]);
  const brokenLinks: Array<{ project: string; href: string }> = [];
  const linkRegex = /\]\((\/[^)\s]+)\)/g;
  for (const project of projects) {
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(project.content)) !== null) {
      const href = match[1].split("#")[0].replace(/\/$/, "") || "/";
      if (href.startsWith("/_next") || href.startsWith("/api")) continue;
      if (!knownPaths.has(href) && !knownPaths.has(`${href}/`)) {
        brokenLinks.push({ project: project.title, href });
      }
    }
  }
  if (brokenLinks.length) {
    for (const link of brokenLinks.slice(0, 5)) {
      issues.push({
        severity: "warning",
        code: "broken-internal-link",
        message: `Broken internal link “${link.href}” in “${link.project}”.`,
        href: "/admin/projects",
      });
    }
  }

  // Project metadata quality
  for (const project of projects) {
    if (!project.description || project.description.trim().length < 40) {
      issues.push({
        severity: "info",
        code: "short-project-description",
        message: `Project “${project.title}” has a short description, which weakens its page metadata.`,
        href: `/admin/projects/${project.id}`,
      });
    }
  }

  // Site-level configuration
  if (!/^https:\/\//.test(settings.siteUrl)) {
    issues.push({
      severity: "critical",
      code: "site-url",
      message: "The public site URL is not HTTPS, which affects canonical URLs and sitemaps.",
      href: "/admin/settings",
    });
  }
  checks.push({
    label: "Canonical site URL",
    ok: /^https:\/\//.test(settings.siteUrl),
    detail: settings.siteUrl,
    href: "/admin/settings",
  });
  checks.push({
    label: "XML sitemap",
    ok: true,
    detail: "/sitemap.xml is generated dynamically from published content.",
    href: "/sitemap.xml",
  });
  checks.push({
    label: "Robots.txt",
    ok: true,
    detail: "/robots.txt is generated from website settings.",
    href: "/robots.txt",
  });
  checks.push({
    label: "Structured data",
    ok: true,
    detail: "Person, ProfilePage, WebSite, CreativeWork and BreadcrumbList JSON-LD are emitted.",
  });
  checks.push({
    label: "Social sharing image",
    ok: Boolean(settings.defaultSocialImage || byKey.get("home")?.ogImageUrl),
    detail:
      settings.defaultSocialImage || byKey.get("home")?.ogImageUrl
        ? "Configured"
        : "No default Open Graph image configured.",
    href: "/admin/seo?page=home",
  });
  checks.push({
    label: "Analytics",
    ok: Boolean(settings.analyticsId),
    detail: settings.analyticsId
      ? "Google Analytics 4 measurement ID configured."
      : "No GA4 measurement ID configured.",
    href: "/admin/settings",
  });
  checks.push({
    label: "Search Console verification",
    ok: Boolean(settings.googleVerification),
    detail: settings.googleVerification
      ? "Verification token configured."
      : "No Google Search Console verification token configured.",
    href: "/admin/settings",
  });
  checks.push({
    label: "Bing Webmaster verification",
    ok: Boolean(settings.bingVerification),
    detail: settings.bingVerification
      ? "Verification token configured."
      : "No Bing Webmaster verification token configured.",
    href: "/admin/settings",
  });

  const publishedResume = await db.resumeVersion.findFirst({
    where: { status: "PUBLISHED" },
    select: { id: true, outdated: true, title: true },
  });
  checks.push({
    label: "Approved resume",
    ok: Boolean(publishedResume) && !publishedResume?.outdated,
    detail: publishedResume
      ? publishedResume.outdated
        ? "The published resume is outdated and should be reviewed."
        : `Published: ${publishedResume.title}`
      : "No approved resume is available for download.",
    href: "/admin/resume",
  });

  const sitemapEntries = 4 + projects.length;
  const indexedPages = sitemapEntries;

  const weights = { critical: 10, warning: 4, info: 1 } as const;
  const penalty = issues.reduce((sum, issue) => sum + weights[issue.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    score,
    issues,
    checks,
    stats: {
      pages: STATIC_PAGES.length,
      publishedProjects: projects.length,
      indexedPages,
      missingAlt,
      brokenLinks: brokenLinks.length,
      duplicateTitles,
    },
  };
}
