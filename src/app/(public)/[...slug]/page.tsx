import { notFound, permanentRedirect, redirect } from "next/navigation";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Handles managed redirects for paths that do not match a real route, and gives
 * unknown paths a proper 404 response. Redirects are stored in PostgreSQL and
 * can be changed from the SEO manager without a redeploy.
 */
export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const source = `/${slug.join("/")}`;

  let record = await db.redirect.findUnique({ where: { source } });

  // Tolerate a trailing slash when looking up a managed redirect.
  if (!record && source.endsWith("/")) {
    record = await db.redirect.findUnique({ where: { source: source.slice(0, -1) } });
  }

  if (record) {
    await db.redirect
      .update({ where: { id: record.id }, data: { hits: { increment: 1 } } })
      .catch(() => undefined);

    if (record.permanent) permanentRedirect(record.destination);
    redirect(record.destination);
  }

  notFound();
}
