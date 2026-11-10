import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { ActionForm } from "@/components/admin/action-form";
import { AdminCollection, EditorPanel, ListToolbar, TableShell, Td, Th } from "@/components/admin/collection";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageField } from "@/components/admin/image-field";
import { PageHeader } from "@/components/admin/page-header";
import { ToggleAction } from "@/components/admin/toggle-action";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { uploadMediaAction } from "@/lib/actions/media";
import {
  deleteCertificationAction,
  saveCertificationAction,
  toggleCertificationPublishedAction,
} from "@/lib/actions/content";
import { db } from "@/lib/db";
import { formatDate, toDateInput } from "@/lib/utils";

export const metadata: Metadata = { title: "Certifications" };

export const dynamic = "force-dynamic";

export default async function CertificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const editId = params.edit && params.edit !== "new" ? params.edit : null;

  const [entries, editing] = await Promise.all([
    db.certification.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { issuer: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ sortOrder: "asc" }, { issueDate: "desc" }],
    }),
    editId ? db.certification.findUnique({ where: { id: editId } }) : null,
  ]);

  const published = entries.filter((entry) => entry.published).length;

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Certifications"
        description="Only publish certifications you have actually earned. Leave the section empty if none exist."
        actions={
          <Link
            href="/admin/certifications?edit=new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add certification
          </Link>
        }
      />

      <AdminCollection
        editor={
          params.edit ? (
            <EditorPanel
              title={editing ? "Edit certification" : "Add certification"}
              description="Published certifications appear on the public site and resume."
              closeHref="/admin/certifications"
              tone="accent"
            >
              <ActionForm
                action={saveCertificationAction}
                submitLabel={editing ? "Save certification" : "Add certification"}
                footerClassName="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4"
              >
                {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
                <div className="space-y-3">
                  <Field label="Title" htmlFor="title">
                    <Input id="title" name="title" defaultValue={editing?.title || ""} required maxLength={160} />
                  </Field>
                  <Field label="Issuer" htmlFor="issuer">
                    <Input id="issuer" name="issuer" defaultValue={editing?.issuer || ""} required maxLength={160} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Issue date" htmlFor="issueDate">
                      <Input id="issueDate" name="issueDate" type="date" defaultValue={toDateInput(editing?.issueDate)} />
                    </Field>
                    <Field label="Expiry date" htmlFor="expiryDate">
                      <Input id="expiryDate" name="expiryDate" type="date" defaultValue={toDateInput(editing?.expiryDate)} />
                    </Field>
                  </div>
                  <Field label="Credential ID" htmlFor="credentialId">
                    <Input id="credentialId" name="credentialId" defaultValue={editing?.credentialId || ""} maxLength={160} />
                  </Field>
                  <Field label="Credential URL" htmlFor="credentialUrl" hint="Link to the issuer's verification page.">
                    <Input
                      id="credentialUrl"
                      name="credentialUrl"
                      type="url"
                      defaultValue={editing?.credentialUrl || ""}
                      maxLength={600}
                      placeholder="https://…"
                    />
                  </Field>
                  <ImageField
                    name="imageUrl"
                    label="Certificate image"
                    value={editing?.imageUrl || ""}
                    uploadAction={uploadMediaAction}
                    folder="certifications"
                    aspect={4 / 3}
                    hint="Optional. Upload a clear image of the certificate."
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Sort order" htmlFor="sortOrder">
                      <Input
                        id="sortOrder"
                        name="sortOrder"
                        type="number"
                        min={0}
                        max={999}
                        defaultValue={editing?.sortOrder ?? entries.length}
                      />
                    </Field>
                    <Checkbox
                      name="published"
                      label="Published"
                      description="Include this certification publicly."
                      defaultChecked={editing?.published ?? false}
                      className="mt-5"
                    />
                  </div>
                </div>
              </ActionForm>
            </EditorPanel>
          ) : undefined
        }
      >
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {[
            { label: "Certifications", value: entries.length },
            { label: "Published", value: published },
            { label: "Drafts", value: entries.length - published },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card px-3 py-2">
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        <ListToolbar defaultValue={q} placeholder="Search certification or issuer…" />

        {entries.length ? (
          <TableShell>
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr>
                  <Th>Certification</Th>
                  <Th>Issued</Th>
                  <Th>Credential</Th>
                  <Th>Order</Th>
                  <Th>Published</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                    <Td>
                      <p className="font-medium">{entry.title}</p>
                      <p className="text-[10px] text-muted-foreground">{entry.issuer}</p>
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">
                      {entry.issueDate ? formatDate(entry.issueDate) : "—"}
                      {entry.expiryDate ? ` → ${formatDate(entry.expiryDate)}` : ""}
                    </Td>
                    <Td className="text-muted-foreground">{entry.credentialId ? "Recorded" : "—"}</Td>
                    <Td className="tabular-nums text-muted-foreground">{entry.sortOrder}</Td>
                    <Td>
                      <ToggleAction
                        id={entry.id}
                        checked={entry.published}
                        action={toggleCertificationPublishedAction}
                        label={`${entry.published ? "Unpublish" : "Publish"} ${entry.title}`}
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/certifications?edit=${entry.id}`}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Link>
                        <ConfirmDelete
                          id={entry.id}
                          name={entry.title}
                          action={deleteCertificationAction}
                          size="icon"
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        ) : (
          <EmptyState
            icon="BadgeCheck"
            title={q ? "No certifications match this search" : "No certifications yet"}
            description={
              q
                ? "Try a different search term."
                : "Certifications are optional. Add only credentials you have actually earned and can verify."
            }
            action={
              <Link
                href="/admin/certifications?edit=new"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add certification
              </Link>
            }
          />
        )}
      </AdminCollection>
    </div>
  );
}
