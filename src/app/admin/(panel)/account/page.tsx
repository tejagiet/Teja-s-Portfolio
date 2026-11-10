import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";

import { ActionForm } from "@/components/admin/action-form";
import { PageHeader } from "@/components/admin/page-header";
import { PhotoManager } from "@/components/admin/photo-manager";
import { Panel } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { changePasswordAction, updateAccountAction } from "@/lib/actions/account";
import {
  removeProfilePhotoAction,
  restoreProfilePhotoAction,
  saveProfilePhotoAction,
} from "@/lib/actions/media";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { formatDateTime, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Account" };

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireAdmin();
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      previousImage: true,
      role: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      profile: { select: { displayName: true } },
    },
  });

  if (!user) {
    return (
      <div>
        <PageHeader eyebrow="System" title="Account" description="Administrator account settings." />
        <p className="text-sm text-muted-foreground">The account could not be loaded. Sign in again.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Account"
        description="Manage the administrator identity, avatar and password. This account is separate from the public profile and is never exposed on the public site."
        actions={<Badge tone="accent">{user.role}</Badge>}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold tracking-tight">Administrator details</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                The name is shown in the admin header. The email is the sign-in identifier.
              </p>
            </div>
            <div className="p-5">
              <ActionForm action={updateAccountAction} submitLabel="Save account">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" htmlFor="name">
                    <Input id="name" name="name" defaultValue={user.name} required minLength={2} maxLength={80} />
                  </Field>
                  <Field label="Email" htmlFor="email" hint="You will use this email the next time you sign in.">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={user.email}
                      required
                      maxLength={200}
                    />
                  </Field>
                </div>
              </ActionForm>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold tracking-tight">Change password</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Passwords are stored as bcrypt hashes. Use at least 8 characters with lowercase, uppercase and a
                number.
              </p>
            </div>
            <div className="p-5">
              <ActionForm
                action={changePasswordAction}
                submitLabel="Change password"
                pendingLabel="Updating…"
                resetOnSuccess
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Current password" htmlFor="currentPassword" className="sm:col-span-2">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </Field>
                  <Field label="New password" htmlFor="newPassword">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={200}
                    />
                  </Field>
                  <Field label="Confirm new password" htmlFor="confirmPassword">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={200}
                    />
                  </Field>
                </div>
              </ActionForm>
            </div>
          </section>

          <Panel
            title="Session and sign-in"
            description="Informational only. Sessions are managed by Auth.js using signed cookies."
          >
            <dl className="grid gap-2 text-[11px] sm:grid-cols-2">
              {[
                ["Last sign-in", user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Not recorded"],
                ["Account created", formatDateTime(user.createdAt)],
                ["Last updated", formatDateTime(user.updatedAt)],
                ["Account ID", user.id],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-muted/40 px-2.5 py-2">
                  <dt className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 break-all font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
              Sign out from the account menu in the header. There is no public registration route, and the setup
              route refuses to run after the first account exists.
            </p>
          </Panel>
        </div>

        <div className="space-y-4">
          <PhotoManager
            kind="avatar"
            currentUrl={user.image}
            previousUrl={user.previousImage}
            title="Admin avatar"
            description="Shown in the admin header and account menu. It is independent from the public profile photo and is never shown on the public site."
            aspect={1}
            cropShape="round"
            previewClassName="relative mx-auto flex aspect-square w-40 items-center justify-center overflow-hidden rounded-full border border-border bg-muted"
            uploadAction={saveProfilePhotoAction}
            removeAction={removeProfilePhotoAction}
            restoreAction={restoreProfilePhotoAction}
          />

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-accent" aria-hidden />
              <h3 className="text-xs font-semibold">Public identity</h3>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/40 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold">
                {initials(user.profile?.displayName || user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{user.profile?.displayName || "No public profile"}</p>
                <p className="text-[10px] text-muted-foreground">Published separately</p>
              </div>
            </div>
            <p className="mt-2.5 text-[10px] leading-relaxed text-muted-foreground">
              Edit the name, introduction, public portrait and contact details in the{" "}
              <Link href="/admin/profile" className="font-medium text-accent hover:underline">
                Profile module
              </Link>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-accent" aria-hidden />
              <h3 className="text-xs font-semibold">Password guidance</h3>
            </div>
            <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-[10px] leading-relaxed text-muted-foreground">
              <li>Use a unique password that is not reused anywhere else.</li>
              <li>Store it in a password manager.</li>
              <li>Changing the password does not sign out other sessions.</li>
              <li>If you lose access, reset the password hash directly in the database.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
              <h3 className="text-xs font-semibold">Security notes</h3>
            </div>
            <p className="mt-2.5 text-[10px] leading-relaxed text-muted-foreground">
              Sign-in attempts are rate limited by IP and email. Every account change is written to the activity log.
              Remove ADMIN_SETUP_TOKEN from the environment after setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
