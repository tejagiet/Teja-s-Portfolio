"use server";

import { revalidatePath } from "next/cache";

import { SEO_PAGES } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { assertAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import {
  actionError,
  actionSuccess,
  fdBool,
  fdList,
  fdOptional,
  fdString,
  redirectSchema,
  seoPageSchema,
  zodError,
  type ActionState,
} from "@/lib/validation";

export async function saveSeoPageAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const pageKey = fdString(formData, "pageKey");
  const page = SEO_PAGES.find((entry) => entry.key === pageKey);
  if (!page) return actionError("Choose a valid page.");

  const parsed = seoPageSchema.safeParse({
    pageKey,
    title: fdString(formData, "title"),
    description: fdString(formData, "description"),
    keywords: fdList(formData, "keywords"),
    ogImageUrl: fdOptional(formData, "ogImageUrl"),
    canonicalUrl: fdOptional(formData, "canonicalUrl"),
    noIndex: fdBool(formData, "noIndex"),
  });
  if (!parsed.success) return zodError(parsed.error);

  try {
    await db.seoMetadata.upsert({
      where: { pageKey },
      update: {
        path: page.path,
        title: parsed.data.title,
        description: parsed.data.description,
        keywords: parsed.data.keywords,
        ogImageUrl: parsed.data.ogImageUrl || null,
        canonicalUrl: parsed.data.canonicalUrl || null,
        noIndex: parsed.data.noIndex,
      },
      create: {
        pageKey,
        path: page.path,
        title: parsed.data.title,
        description: parsed.data.description,
        keywords: parsed.data.keywords,
        ogImageUrl: parsed.data.ogImageUrl || null,
        canonicalUrl: parsed.data.canonicalUrl || null,
        noIndex: parsed.data.noIndex,
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: "seo",
      entityId: pageKey,
      description: `Updated SEO metadata for ${page.label}`,
    });

    revalidatePath(page.path);
    revalidatePath("/admin/seo");
    revalidatePath("/sitemap.xml");
    return actionSuccess(`${page.label} metadata saved.`);
  } catch (error) {
    console.error("[seo-save]", error);
    return actionError("The page metadata could not be saved.");
  }
}

export async function saveRedirectAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const id = fdString(formData, "id");

  const parsed = redirectSchema.safeParse({
    source: fdString(formData, "source"),
    destination: fdString(formData, "destination"),
    permanent: fdBool(formData, "permanent"),
  });
  if (!parsed.success) return zodError(parsed.error);

  try {
    if (parsed.data.source === parsed.data.destination) {
      return actionError("A redirect cannot point to itself.");
    }

    const source = parsed.data.source.replace(/\/+$/, "") || "/";
    const duplicate = await db.redirect.findFirst({
      where: id ? { source, NOT: { id } } : { source },
      select: { id: true },
    });
    if (duplicate) return actionError("A redirect already exists for that source path.");

    if (id) {
      const existing = await db.redirect.findUnique({ where: { id } });
      if (!existing) return actionError("That redirect no longer exists.");
      await db.redirect.update({
        where: { id },
        data: {
          source,
          destination: parsed.data.destination,
          permanent: parsed.data.permanent,
        },
      });
      await logActivity({
        userId: user.id,
        action: "UPDATE",
        entityType: "redirect",
        entityId: id,
        description: `Updated redirect ${source}`,
      });
    } else {
      const created = await db.redirect.create({
        data: {
          source,
          destination: parsed.data.destination,
          permanent: parsed.data.permanent,
        },
      });
      await logActivity({
        userId: user.id,
        action: "CREATE",
        entityType: "redirect",
        entityId: created.id,
        description: `Created redirect ${source}`,
      });
    }

    revalidatePath("/admin/seo");
    revalidatePath("/", "layout");
    return actionSuccess(id ? "Redirect saved." : "Redirect created.", {
      redirectTo: "/admin/seo?tab=redirects",
    });
  } catch (error) {
    console.error("[redirect-save]", error);
    return actionError("The redirect could not be saved.");
  }
}

export async function deleteRedirectAction(id: string): Promise<ActionState> {
  const user = await assertAdmin();
  try {
    const redirect = await db.redirect.findUnique({ where: { id } });
    if (!redirect) return actionError("That redirect no longer exists.");

    await db.redirect.delete({ where: { id } });
    await logActivity({
      userId: user.id,
      action: "DELETE",
      entityType: "redirect",
      entityId: id,
      description: `Deleted redirect ${redirect.source}`,
    });
    revalidatePath("/admin/seo");
    return actionSuccess("Redirect deleted.");
  } catch (error) {
    console.error("[redirect-delete]", error);
    return actionError("The redirect could not be deleted.");
  }
}

type PageSpeedScores = {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
};

export async function runPageSpeedAction(
  strategy: "mobile" | "desktop",
): Promise<ActionState> {
  await assertAdmin();
  const settings = await getSiteSettings();

  if (!/^https?:\/\//.test(settings.siteUrl) || /localhost|127\.0\.0\.1|\.local/i.test(settings.siteUrl)) {
    return actionError(
      "PageSpeed Insights needs a publicly reachable HTTPS URL. Update the site URL in Settings and try again.",
    );
  }

  try {
    const params = new URLSearchParams({ url: settings.siteUrl, strategy });
    for (const category of ["performance", "accessibility", "best-practices", "seo"]) {
      params.append("category", category);
    }
    if (process.env.PAGESPEED_API_KEY) {
      params.set("key", process.env.PAGESPEED_API_KEY);
    }

    const response = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`,
      { signal: AbortSignal.timeout(60_000), cache: "no-store" },
    );
    const result = (await response.json()) as {
      error?: { message?: string };
      lighthouseResult?: {
        categories?: Record<string, { score?: number }>;
        audits?: Record<string, { displayValue?: string }>;
      };
    };

    if (!response.ok || !result.lighthouseResult) {
      return actionError(result.error?.message || "PageSpeed Insights could not analyze the site.");
    }

    const category = result.lighthouseResult.categories ?? {};
    const score = (key: string) =>
      typeof category[key]?.score === "number" ? Math.round(category[key]!.score! * 100) : null;
    const scores: PageSpeedScores = {
      performance: score("performance"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
      seo: score("seo"),
    };
    const audits = result.lighthouseResult.audits ?? {};
    const metrics = [
      ["Largest Contentful Paint", audits["largest-contentful-paint"]?.displayValue],
      ["First Contentful Paint", audits["first-contentful-paint"]?.displayValue],
      ["Total Blocking Time", audits["total-blocking-time"]?.displayValue],
      ["Cumulative Layout Shift", audits["cumulative-layout-shift"]?.displayValue],
      ["Speed Index", audits["speed-index"]?.displayValue],
    ].filter((entry): entry is [string, string] => Boolean(entry[1]));

    return actionSuccess(`PageSpeed Insights finished for ${strategy}.`, {
      strategy,
      scores,
      metrics,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[pagespeed]", error);
    return actionError("PageSpeed Insights did not respond. Try again in a moment.");
  }
}
