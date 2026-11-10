import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { ActionForm } from "@/components/admin/action-form";
import { AdminCollection, EditorPanel, ListToolbar, TableShell, Td, Th } from "@/components/admin/collection";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { PageHeader } from "@/components/admin/page-header";
import { ToggleAction } from "@/components/admin/toggle-action";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import {
  deleteEducationAction,
  saveEducationAction,
  toggleEducationPublishedAction,
} from "@/lib/actions/content";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Education" };

export const dynamic = "force-dynamic";

export default async function EducationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const editId = params.edit && params.edit !== "new" ? params.edit : null;

  const [entries, editing] = await Promise.all([
    db.education.findMany({
      where: q
        ? {
            OR: [
              { institution: { contains: q, mode: "insensitive" } },
              { degree: { contains: q, mode: "insensitive" } },
              { field: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ sortOrder: "asc" }, { startYear: "desc" }],
    }),
    editId ? db.education.findUnique({ where: { id: editId } }) : null,
  ]);

  const published = entries.filter((entry) => entry.published).length;

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Education"
        description="Academic history shown on the portfolio and resume. Use expected completion dates where applicable."
        actions={
          <Link
            href="/admin/education?edit=new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add education
          </Link>
        }
      />

      <AdminCollection
        editor={
          params.edit ? (
            <EditorPanel
              title={editing ? "Edit education" : "Add education"}
              description="Published entries appear on the public site and in generated resumes."
              closeHref="/admin/education"
              tone="accent"
            >
              <ActionForm
                action={saveEducationAction}
                submitLabel={editing ? "Save education" : "Add education"}
                footerClassName="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4"
              >
                {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
                <div className="space-y-3">
                  <Field label="Institution" htmlFor="institution">
                    <Input
                      id="institution"
                      name="institution"
                      defaultValue={editing?.institution || ""}
                      required
                      maxLength={160}
                    />
                  </Field>
                  <Field label="Degree / programme" htmlFor="degree">
                    <Input id="degree" name="degree" defaultValue={editing?.degree || ""} required maxLength={160} />
                  </Field>
                  <Field label="Field of study" htmlFor="field">
                    <Input id="field" name="field" defaultValue={editing?.field || ""} maxLength={160} />
                  </Field>
                  <Field label="Location" htmlFor="location">
                    <Input id="location" name="location" defaultValue={editing?.location || ""} maxLength={120} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Start year" htmlFor="startYear">
                      <Input
                        id="startYear"
                        name="startYear"
                        type="number"
                        min={1950}
                        max={2100}
                        defaultValue={editing?.startYear ?? ""}
                      />
                    </Field>
                    <Field label="End year" htmlFor="endYear">
                      <Input
                        id="endYear"
                        name="endYear"
                        type="number"
                        min={1950}
                        max={2100}
                        defaultValue={editing?.endYear ?? ""}
                      />
                    </Field>
                  </div>
                  <Checkbox
                    name="isCurrent"
                    label="Currently studying"
                    description="Used to describe the programme as ongoing."
                    defaultChecked={editing?.isCurrent ?? false}
                  />
                  <Field label="Grade" htmlFor="grade" hint="Optional. Only include a verified grade.">
                    <Input id="grade" name="grade" defaultValue={editing?.grade || ""} maxLength={60} />
                  </Field>
                  <Field label="Description" htmlFor="description">
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editing?.description || ""}
                      maxLength={2000}
                      className="min-h-20"
                    />
                  </Field>
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
                      description="Include this entry publicly."
                      defaultChecked={editing?.published ?? true}
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
            { label: "Entries", value: entries.length },
            { label: "Published", value: published },
            { label: "Drafts", value: entries.length - published },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card px-3 py-2">
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        <ListToolbar defaultValue={q} placeholder="Search institution, degree or field…" />

        {entries.length ? (
          <TableShell>
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <Th>Programme</Th>
                  <Th>Years</Th>
                  <Th>Status</Th>
                  <Th>Order</Th>
                  <Th>Published</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                    <Td>
                      <p className="font-medium">{entry.degree}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.institution}
                        {entry.field ? ` · ${entry.field}` : ""}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">
                      {entry.startYear || entry.endYear
                        ? `${entry.startYear ?? "—"} — ${entry.isCurrent ? "Present" : entry.endYear ?? "—"}`
                        : "—"}
                    </Td>
                    <Td>
                      {entry.isCurrent ? (
                        <span className="text-[10px] font-medium text-accent">In progress</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Completed / dated</span>
                      )}
                    </Td>
                    <Td className="tabular-nums text-muted-foreground">{entry.sortOrder}</Td>
                    <Td>
                      <ToggleAction
                        id={entry.id}
                        checked={entry.published}
                        action={toggleEducationPublishedAction}
                        label={`${entry.published ? "Unpublish" : "Publish"} ${entry.degree}`}
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/education?edit=${entry.id}`}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Link>
                        <ConfirmDelete
                          id={entry.id}
                          name={entry.degree}
                          action={deleteEducationAction}
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
            icon="GraduationCap"
            title={q ? "No education matches this search" : "No education entries yet"}
            description={
              q
                ? "Try a different search term."
                : "Add your current programme, including an expected completion year when it is known."
            }
            action={
              <Link
                href="/admin/education?edit=new"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add education
              </Link>
            }
          />
        )}
      </AdminCollection>
    </div>
  );
}
