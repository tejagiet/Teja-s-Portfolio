import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/admin/auth-shell";
import { LoginForm } from "@/components/admin/login-form";
import { getCurrentUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  const [params, userCount] = await Promise.all([searchParams, db.user.count()]);
  const next = safeRedirectPath(params.next);

  return (
    <AuthShell
      title="Sign in to the workspace"
      description="Manage every part of the public portfolio, the resume library and technical SEO."
      footer={
        userCount === 0 ? (
          <p className="text-center text-[11px] text-muted-foreground">
            First time here?{" "}
            <Link href="/admin/setup" className="font-medium text-accent hover:underline">
              Initialize the admin account
            </Link>
          </p>
        ) : (
          <p className="text-center text-[10px] text-muted-foreground">
            Access is restricted to the site administrator.
          </p>
        )
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
