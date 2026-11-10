import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { AuthShell } from "@/components/admin/auth-shell";
import { SetupForm } from "@/components/admin/setup-form";
import { getCurrentUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Initial admin setup",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  const userCount = await db.user.count();
  const tokenConfigured = Boolean(process.env.ADMIN_SETUP_TOKEN);

  if (userCount > 0) {
    return (
      <AuthShell
        title="Setup is complete"
        description="An admin account already exists. Sign in to continue managing the portfolio."
      >
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </div>
          <p className="mt-4 text-sm font-medium">This workspace is already initialized.</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            For security, setup cannot run again. Sign in with the administrator credentials.
          </p>
          <Link
            href="/admin/login"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground"
          >
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Initialize the admin account"
      description="Create the single administrator account for this portfolio. Public registration is never available."
    >
      <SetupForm tokenRequired={tokenConfigured} />
      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Already initialized?{" "}
        <Link href="/admin/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
