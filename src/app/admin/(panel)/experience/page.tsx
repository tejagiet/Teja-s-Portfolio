import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { ActionForm } from "@/components/admin/action-form";
import { AdminCollection, EditorPanel, ListToolbar, TableShell, Td, Th } from "@/components/admin/collection";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { PageHeader } from "@/components/admin/page-header";
import { ToggleAction } from "@/components/admin/toggle-action";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  deleteExperienceAction,
  saveExperienceAction,
  toggleExperiencePublishedAction,
} from "@/lib/actions/content";
import { EXPERIENCE_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateRange, toDateInput } from "@/lib/utils";

export const metadata: Metadata = { title: "Experience" };

export const dynamic = "force-dynamic";

export default async function ExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const editId = params.edit && params.edit !== "new" ? params.edit : null;

  const [entries, editing] = await Promise.all([
    db.experience.findMany({
      where: q
        ? {
            OR: [
              { role: { contains: q, mode: "insensitive" } },
              { organization: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
    }),
    editId ? db.experience.findUnique({ where: { id: editId } }) : null,
  ]);

  const published = entries.filter((entry) => entry.published).length;

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Experience"
        description="Only add roles, internships or open-source work that actually happened. Empty is better than invented."
        actions={
          <Link
            href="/admin/experience?edit=new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add experience
          </Link>
        }
      />

      <AdminCollection
        editor={
          params.edit ? (
            <EditorPanel
              title={editing ? "Edit experience" : "Add experience"}
              description="Published entries appear on the public site and in generated resumes."
              closeHref="/admin/experience"
              tone="accent"
            >
              <ActionForm
                action={saveExperienceAction}
                submitLabel={editing ? "Save experience" : "Add experience"}
                footerClassName="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4"
              >
                {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
                <div className="space-y-3">
                  <Field label="Role" htmlFor="role">
                    <Input id="role" name="role" defaultValue={editing?.role || ""} required maxLength={120} />
                  </Field>
                  <Field label="Organization" htmlFor="organization">
                    <Input
                      id="organization"
                      name="organization"
                      defaultValue={editing?.organization || ""}
                      required
                      maxLength={120}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Type" htmlFor="type">
                      <Select id="type" name="type" defaultValue={editing?.type || "WORK"}>
                        {EXPERIENCE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Location" htmlFor="location">
                      <Input id="location" name="location" defaultValue={editing?.location || ""} maxLength={120} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Start date" htmlFor="startDate">
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        defaultValue={toDateInput(editing?.startDate)}
                        required
                      />
                    </Field>
                    <Field label="End date" htmlFor="endDate">
                      <Input id="endDate" name="endDate" type="date" defaultValue={toDateInput(editing?.endDate)} />
                    </Field>
                  </div>
                  <Checkbox
                    name="isCurrent"
                    label="Current role"
                    description="Shows “Present” instead of an end date."
                    defaultChecked={editing?.isCurrent ?? false}
                  />
                  <Field label="Description" htmlFor="description">
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editing?.description || ""}
                      required
                      minLength={10}
                      maxLength={4000}
                      className="min-h-24"
                    />
                  </Field>
                  <Field label="Highlights" htmlFor="highlights" hint="One achievement or responsibility per line. Keep them factual.">
                    <Textarea
                      id="highlights"
                      name="highlights"
                      defaultValue={editing?.highlights.join("\n") || ""}
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

        <ListToolbar defaultValue={q} placeholder="Search role, organization or description…" />

        {entries.length ? (
          <TableShell>
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <Th>Role</Th>
                  <Th>Type</Th>
                  <Th>Dates</Th>
                  <Th>Order</Th>
                  <Th>Published</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                    <Td>
                      <p className="font-medium">{entry.role}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.organization}
                        {entry.location ? ` · ${entry.location}` : ""}
                      </p>
                    </Td>
                    <Td className="text-muted-foreground">
                      {EXPERIENCE_TYPES.find((type) => type.value === entry.type)?.label || entry.type}
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">
                      {formatDateRange(entry.startDate, entry.endDate, entry.isCurrent)}
                    </Td>
                    <Td className="tabular-nums text-muted-foreground">{entry.sortOrder}</Td>
                    <Td>
                      <ToggleAction
                        id={entry.id}
                        checked={entry.published}
                        action={toggleExperiencePublishedAction}
                        label={`${entry.published ? "Unpublish" : "Publish"} ${entry.role}`}
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/experience?edit=${entry.id}`}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Link>
                        <ConfirmDelete
                          id={entry.id}
                          name={`${entry.role} at ${entry.organization}`}
                          action={deleteExperienceAction}
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
            icon="Briefcase"
            title={q ? "No experience matches this search" : "No experience entries yet"}
            description={
              q
                ? "Try a different search term."
                : "Add verified work, internships, open-source contributions or volunteer roles when they exist. It is fine to leave this section empty."
            }
            action={
              <Link
                href="/admin/experience?edit=new"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add experience
              </Link>
            }
          />
        )}
      </AdminCollection>
    </div>
  );
}
