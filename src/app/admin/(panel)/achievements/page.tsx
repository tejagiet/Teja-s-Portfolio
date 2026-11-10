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
import { Icon } from "@/components/ui/icon";
import {
  deleteAchievementAction,
  saveAchievementAction,
  toggleAchievementPublishedAction,
} from "@/lib/actions/content";
import { db } from "@/lib/db";
import { formatDate, toDateInput } from "@/lib/utils";

export const metadata: Metadata = { title: "Achievements" };

export const dynamic = "force-dynamic";

export default async function AchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const editId = params.edit && params.edit !== "new" ? params.edit : null;

  const [entries, editing] = await Promise.all([
    db.achievement.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ sortOrder: "asc" }, { date: "desc" }],
    }),
    editId ? db.achievement.findUnique({ where: { id: editId } }) : null,
  ]);

  const published = entries.filter((entry) => entry.published).length;

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Achievements"
        description="Awards, recognitions and milestones. Add only achievements you can verify; it is fine to leave this empty."
        actions={
          <Link
            href="/admin/achievements?edit=new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add achievement
          </Link>
        }
      />

      <AdminCollection
        editor={
          params.edit ? (
            <EditorPanel
              title={editing ? "Edit achievement" : "Add achievement"}
              description="Published achievements appear publicly once they are added."
              closeHref="/admin/achievements"
              tone="accent"
            >
              <ActionForm
                action={saveAchievementAction}
                submitLabel={editing ? "Save achievement" : "Add achievement"}
                footerClassName="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4"
              >
                {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
                <div className="space-y-3">
                  <Field label="Title" htmlFor="title">
                    <Input id="title" name="title" defaultValue={editing?.title || ""} required maxLength={160} />
                  </Field>
                  <Field label="Description" htmlFor="description">
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editing?.description || ""}
                      required
                      minLength={5}
                      maxLength={2000}
                      className="min-h-24"
                    />
                  </Field>
                  <Field label="Date" htmlFor="date" hint="Optional.">
                    <Input id="date" name="date" type="date" defaultValue={toDateInput(editing?.date)} />
                  </Field>
                  <Field label="Icon name" htmlFor="icon" hint="Optional. Example: Trophy, Award, Star.">
                    <Input id="icon" name="icon" defaultValue={editing?.icon || ""} maxLength={50} />
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
                      description="Show this achievement."
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
            { label: "Achievements", value: entries.length },
            { label: "Published", value: published },
            { label: "Drafts", value: entries.length - published },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card px-3 py-2">
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        <ListToolbar defaultValue={q} placeholder="Search achievements…" />

        {entries.length ? (
          <TableShell>
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <Th>Achievement</Th>
                  <Th>Date</Th>
                  <Th>Order</Th>
                  <Th>Published</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                    <Td>
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon name={entry.icon || "Trophy"} className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">{entry.title}</p>
                          <p className="max-w-[26rem] truncate text-[10px] text-muted-foreground">
                            {entry.description}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">
                      {entry.date ? formatDate(entry.date) : "—"}
                    </Td>
                    <Td className="tabular-nums text-muted-foreground">{entry.sortOrder}</Td>
                    <Td>
                      <ToggleAction
                        id={entry.id}
                        checked={entry.published}
                        action={toggleAchievementPublishedAction}
                        label={`${entry.published ? "Unpublish" : "Publish"} ${entry.title}`}
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/achievements?edit=${entry.id}`}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Link>
                        <ConfirmDelete
                          id={entry.id}
                          name={entry.title}
                          action={deleteAchievementAction}
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
            icon="Trophy"
            title={q ? "No achievements match this search" : "No achievements yet"}
            description={
              q
                ? "Try a different search term."
                : "Add verified awards or milestones when you have them. The public section stays hidden while this list is empty."
            }
            action={
              <Link
                href="/admin/achievements?edit=new"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add achievement
              </Link>
            }
          />
        )}
      </AdminCollection>
    </div>
  );
}
