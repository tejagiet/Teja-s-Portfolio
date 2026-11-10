import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import { ActionForm } from "@/components/admin/action-form";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { EditorPanel } from "@/components/admin/collection";
import { PageHeader } from "@/components/admin/page-header";
import { PhotoManager } from "@/components/admin/photo-manager";
import { ToggleAction } from "@/components/admin/toggle-action";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import {
  deleteSocialLinkAction,
  saveSocialLinkAction,
  toggleSocialLinkAction,
  updateProfileAction,
} from "@/lib/actions/profile";
import {
  removeProfilePhotoAction,
  restoreProfilePhotoAction,
  saveProfilePhotoAction,
} from "@/lib/actions/media";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Profile" };

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ social?: string }>;
}) {
  const params = await searchParams;
  const profile = await db.profile.findFirst({
    include: { socialLinks: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] } },
  });

  if (!profile) {
    return (
      <div>
        <PageHeader eyebrow="Content" title="Profile" description="The identity used across the public portfolio." />
        <EmptyState
          icon="CircleUser"
          title="No public profile yet"
          description="A profile is normally created by the seed or initial setup. Run the seed or initialize the admin account to continue."
        />
      </div>
    );
  }

  const socialId = params.social === "new" ? null : params.social;
  const editingSocial = params.social
    ? socialId
      ? profile.socialLinks.find((link) => link.id === socialId)
      : null
    : undefined;

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Profile"
        description="Edit the public identity, introduction, contact details and social links. Photo fields save immediately and are never overwritten by this form."
        actions={
          <Link
            href="/#about"
            target="_blank"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View about section
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold tracking-tight">Public details</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                These values power the hero, about section, contact details, JSON-LD and resume snapshots.
              </p>
            </div>
            <div className="p-5">
              <ActionForm action={updateProfileAction} submitLabel="Save profile">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Display name" htmlFor="displayName">
                    <Input id="displayName" name="displayName" defaultValue={profile.displayName} required maxLength={100} />
                  </Field>
                  <Field label="Professional title" htmlFor="title" hint="Shown under your name.">
                    <Input id="title" name="title" defaultValue={profile.title} required maxLength={160} />
                  </Field>
                  <Field label="Tagline" htmlFor="tagline" hint="A short line used in the hero." className="sm:col-span-2">
                    <Input id="tagline" name="tagline" defaultValue={profile.tagline || ""} maxLength={200} />
                  </Field>
                  <Field label="Short bio" htmlFor="shortBio" hint="One or two sentences for cards and metadata." className="sm:col-span-2">
                    <Textarea id="shortBio" name="shortBio" defaultValue={profile.shortBio || ""} maxLength={500} className="min-h-20" />
                  </Field>
                  <Field
                    label="About"
                    htmlFor="about"
                    hint="The full introduction. Blank lines separate paragraphs."
                    className="sm:col-span-2"
                  >
                    <Textarea id="about" name="about" defaultValue={profile.about} required minLength={20} maxLength={6000} className="min-h-56" />
                  </Field>
                  <Field label="Public email" htmlFor="email" hint="Leave blank to show no email.">
                    <Input id="email" name="email" type="email" defaultValue={profile.email || ""} maxLength={200} />
                  </Field>
                  <Field label="Phone" htmlFor="phone" hint="Optional. Only add a number you want public.">
                    <Input id="phone" name="phone" defaultValue={profile.phone || ""} maxLength={50} />
                  </Field>
                  <Field label="Location" htmlFor="location">
                    <Input id="location" name="location" defaultValue={profile.location || ""} maxLength={120} />
                  </Field>
                  <Field label="Availability" htmlFor="availability">
                    <Input id="availability" name="availability" defaultValue={profile.availability || ""} maxLength={160} />
                  </Field>
                  <Field
                    label="Resume summary"
                    htmlFor="resumeSummary"
                    hint="Used as the default summary when generating a resume. Falls back to the short bio or about text."
                    className="sm:col-span-2"
                  >
                    <Textarea id="resumeSummary" name="resumeSummary" defaultValue={profile.resumeSummary || ""} maxLength={2000} className="min-h-28" />
                  </Field>
                  <Field
                    label="Interests / focus areas"
                    htmlFor="interests"
                    hint="One per line or separated by commas. These appear in the about section and resume."
                    className="sm:col-span-2"
                  >
                    <Textarea id="interests" name="interests" defaultValue={profile.interests.join("\n")} maxLength={2000} />
                  </Field>
                </div>
              </ActionForm>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Social links</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Only visible links appear on the public site. The seeded links are placeholders and stay hidden until
                  you replace them with real profiles.
                </p>
              </div>
              <Link
                href="/admin/profile?social=new"
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-2.5 text-[11px] font-medium text-accent-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add link
              </Link>
            </div>
            {profile.socialLinks.length ? (
              <ul className="divide-y divide-border">
                {profile.socialLinks.map((link) => (
                  <li key={link.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon name={link.icon || link.platform} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-xs font-medium">
                        {link.label}
                        {link.isVisible ? <Badge tone="success">Visible</Badge> : <Badge tone="neutral">Hidden</Badge>}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ToggleAction
                        id={link.id}
                        checked={link.isVisible}
                        action={toggleSocialLinkAction}
                        label={`${link.isVisible ? "Hide" : "Show"} ${link.label}`}
                      />
                      <Link
                        href={`/admin/profile?social=${link.id}`}
                        className="inline-flex h-7 items-center rounded-lg border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Edit
                      </Link>
                      <ConfirmDelete
                        id={link.id}
                        name={link.label}
                        action={deleteSocialLinkAction}
                        size="icon"
                        description="The link will be removed from the public site and resume."
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState
                  compact
                  icon="Link2"
                  title="No social links"
                  description="Add a GitHub, LinkedIn or other profile to help visitors verify your work."
                />
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          {params.social ? (
            <EditorPanel
              title={editingSocial ? "Edit social link" : "Add social link"}
              description="Use the exact URL of your public profile. Hidden links are stored but not displayed."
              closeHref="/admin/profile"
              tone="accent"
            >
              <ActionForm
                action={saveSocialLinkAction}
                submitLabel={editingSocial ? "Save link" : "Add link"}
                footerClassName="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4"
              >
                {editingSocial ? <input type="hidden" name="id" value={editingSocial.id} /> : null}
                <div className="space-y-3">
                  <Field label="Platform" htmlFor="platform">
                    <Input
                      id="platform"
                      name="platform"
                      defaultValue={editingSocial?.platform || ""}
                      placeholder="GitHub"
                      required
                      maxLength={50}
                    />
                  </Field>
                  <Field label="Label" htmlFor="social-label">
                    <Input
                      id="social-label"
                      name="label"
                      defaultValue={editingSocial?.label || ""}
                      placeholder="GitHub"
                      required
                      maxLength={60}
                    />
                  </Field>
                  <Field label="URL" htmlFor="social-url">
                    <Input
                      id="social-url"
                      name="url"
                      type="url"
                      defaultValue={editingSocial?.url || ""}
                      placeholder="https://github.com/username"
                      required
                      maxLength={600}
                    />
                  </Field>
                  <Field label="Icon name" htmlFor="social-icon" hint="Optional: Github, Linkedin, Twitter, Globe, Mail…">
                    <Input id="social-icon" name="icon" defaultValue={editingSocial?.icon || ""} maxLength={50} />
                  </Field>
                  <Field label="Sort order" htmlFor="social-order">
                    <Input
                      id="social-order"
                      name="sortOrder"
                      type="number"
                      min={0}
                      max={999}
                      defaultValue={editingSocial?.sortOrder ?? profile.socialLinks.length}
                    />
                  </Field>
                  <Checkbox
                    name="isVisible"
                    label="Visible on the public site"
                    description="Only show links that are genuinely yours."
                    defaultChecked={editingSocial ? editingSocial.isVisible : true}
                  />
                </div>
              </ActionForm>
            </EditorPanel>
          ) : null}

          <PhotoManager
            kind="profile"
            currentUrl={profile.profilePhotoUrl}
            previousUrl={profile.previousProfilePhotoUrl}
            title="Public profile photo"
            description="Used in the hero, about section, social previews and resume. Uploads are cropped, resized and converted to WebP."
            aspect={1}
            uploadAction={saveProfilePhotoAction}
            removeAction={removeProfilePhotoAction}
            restoreAction={restoreProfilePhotoAction}
          />

          <PhotoManager
            kind="about"
            currentUrl={profile.aboutPhotoUrl}
            previousUrl={profile.previousAboutPhotoUrl}
            title="About section photo"
            description="An optional second image shown beside the introduction. It is never used as the admin avatar."
            aspect={4 / 3}
            uploadAction={saveProfilePhotoAction}
            removeAction={removeProfilePhotoAction}
            restoreAction={restoreProfilePhotoAction}
          />

          <div className="rounded-2xl border border-border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Photo behaviour</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>Images are optimized server-side to WebP with a maximum dimension.</li>
              <li>Removing a photo keeps one previous image available to restore.</li>
              <li>The admin avatar is managed separately under Account.</li>
              <li>Profile form saves never overwrite the photo fields.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
