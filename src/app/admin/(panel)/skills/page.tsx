import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { ActionForm } from "@/components/admin/action-form";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { EditorPanel, ListToolbar, TableShell, Td, Th } from "@/components/admin/collection";
import { PageHeader } from "@/components/admin/page-header";
import { ToggleAction } from "@/components/admin/toggle-action";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  deleteSkillAction,
  deleteSkillCategoryAction,
  saveSkillAction,
  saveSkillCategoryAction,
  toggleSkillVisibilityAction,
} from "@/lib/actions/skills";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Skills" };

export const dynamic = "force-dynamic";

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; editCategory?: string; skill?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const filterCategory = params.category || "";
  const skillEditorId = params.skill && params.skill !== "new" ? params.skill : null;

  const [categories, skills, editingCategory, editingSkill] = await Promise.all([
    db.skillCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { skills: { select: { id: true, isVisible: true } } },
    }),
    db.skill.findMany({
      where: {
        ...(filterCategory ? { categoryId: filterCategory } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
      include: { category: { select: { id: true, name: true } } },
    }),
    params.editCategory && params.editCategory !== "new"
      ? db.skillCategory.findUnique({ where: { id: params.editCategory } })
      : null,
    skillEditorId ? db.skill.findUnique({ where: { id: skillEditorId } }) : null,
  ]);

  const totalSkills = categories.reduce((sum, category) => sum + category.skills.length, 0);
  const visibleSkills = categories.reduce(
    (sum, category) => sum + category.skills.filter((skill) => skill.isVisible).length,
    0,
  );
  const selectedCategory = categories.find((category) => category.id === filterCategory);
  const newSkillCategoryId = filterCategory || (categories.length ? categories[0].id : "");

  const editor =
    params.editCategory || params.skill ? (
      <div className="space-y-4">
        {params.editCategory ? (
          <EditorPanel
            title={editingCategory ? "Edit category" : "New skill category"}
            description="Categories group related skills on the public site and resume."
            closeHref="/admin/skills"
            tone="accent"
          >
            <ActionForm
              action={saveSkillCategoryAction}
              submitLabel={editingCategory ? "Save category" : "Create category"}
              footerClassName="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4"
            >
              {editingCategory ? <input type="hidden" name="id" value={editingCategory.id} /> : null}
              <div className="space-y-3">
                <Field label="Name" htmlFor="category-name">
                  <Input id="category-name" name="name" defaultValue={editingCategory?.name || ""} required maxLength={80} />
                </Field>
                <Field label="Slug" htmlFor="category-slug" hint="Optional. Generated from the name when blank.">
                  <Input
                    id="category-slug"
                    name="slug"
                    defaultValue={editingCategory?.slug || ""}
                    maxLength={80}
                    pattern="[a-z0-9-]*"
                  />
                </Field>
                <Field label="Description" htmlFor="category-description">
                  <Textarea
                    id="category-description"
                    name="description"
                    defaultValue={editingCategory?.description || ""}
                    maxLength={300}
                    className="min-h-20"
                  />
                </Field>
                <Field label="Sort order" htmlFor="category-order">
                  <Input
                    id="category-order"
                    name="sortOrder"
                    type="number"
                    min={0}
                    max={999}
                    defaultValue={editingCategory?.sortOrder ?? categories.length}
                  />
                </Field>
              </div>
            </ActionForm>
          </EditorPanel>
        ) : null}

        {params.skill ? (
          <EditorPanel
            title={editingSkill ? "Edit skill" : "Add skill"}
            description="Only include skills you are genuinely comfortable discussing. Levels are optional."
            closeHref="/admin/skills"
            tone="accent"
          >
            <ActionForm
              action={saveSkillAction}
              submitLabel={editingSkill ? "Save skill" : "Add skill"}
              footerClassName="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4"
            >
              {editingSkill ? <input type="hidden" name="id" value={editingSkill.id} /> : null}
              <div className="space-y-3">
                <Field label="Category" htmlFor="skill-category">
                  <Select
                    id="skill-category"
                    name="categoryId"
                    defaultValue={editingSkill?.categoryId || newSkillCategoryId}
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Skill" htmlFor="skill-name">
                  <Input id="skill-name" name="name" defaultValue={editingSkill?.name || ""} required maxLength={80} />
                </Field>
                <Field label="Level (optional)" htmlFor="skill-level" hint="0–100. Leave blank to show no level bar.">
                  <Input
                    id="skill-level"
                    name="level"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={editingSkill?.level ?? ""}
                  />
                </Field>
                <Field label="Icon name" htmlFor="skill-icon" hint="Optional. Example: Code2, Database, Cloud.">
                  <Input id="skill-icon" name="icon" defaultValue={editingSkill?.icon || ""} maxLength={50} />
                </Field>
                <Field label="Sort order" htmlFor="skill-order">
                  <Input
                    id="skill-order"
                    name="sortOrder"
                    type="number"
                    min={0}
                    max={999}
                    defaultValue={editingSkill?.sortOrder ?? 0}
                  />
                </Field>
                <Checkbox
                  name="isVisible"
                  label="Visible on the public site"
                  description="Hidden skills are kept for later but omitted from the portfolio and resume."
                  defaultChecked={editingSkill ? editingSkill.isVisible : true}
                />
              </div>
            </ActionForm>
          </EditorPanel>
        ) : null}
      </div>
    ) : undefined;

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Skills"
        description="Group skills into categories, set optional proficiency levels and choose what appears publicly."
        actions={
          <>
            <Link
              href="/admin/skills?editCategory=new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              New category
            </Link>
            <Link
              href={`/admin/skills?skill=new${filterCategory ? `&category=${filterCategory}` : ""}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add skill
            </Link>
          </>
        }
      />

      <div
        className={`grid items-start gap-5 ${
          editor ? "xl:grid-cols-[minmax(0,1fr)_25rem]" : ""
        }`}
      >
        <div className="min-w-0">
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {[
              { label: "Categories", value: categories.length },
              { label: "Skills", value: totalSkills },
              { label: "Visible", value: visibleSkills },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card px-3 py-2">
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>

          <section className="mb-5 rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-xs font-semibold">Skill categories</h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Categories without visible skills are hidden from the public site and resume.
              </p>
            </div>
            {categories.length ? (
              <ul className="divide-y divide-border">
                {categories.map((category) => {
                  const visible = category.skills.filter((skill) => skill.isVisible).length;
                  return (
                    <li key={category.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-xs font-medium">
                          {category.name}
                          <Badge tone="neutral">{category.skills.length} skills</Badge>
                          <Badge tone={visible ? "success" : "warning"}>{visible} visible</Badge>
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          /{category.slug}
                          {category.description ? ` · ${category.description}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/skills?category=${category.id}`}
                          className="inline-flex h-7 items-center rounded-lg border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Filter
                        </Link>
                        <Link
                          href={`/admin/skills?editCategory=${category.id}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Link>
                        <ConfirmDelete
                          id={category.id}
                          name={category.name}
                          action={deleteSkillCategoryAction}
                          size="icon"
                          description="Deleting a category also deletes every skill inside it."
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-4">
                <EmptyState
                  compact
                  icon="Sparkles"
                  title="No skill categories"
                  description="Create a category such as Frontend, Backend or Databases before adding skills."
                />
              </div>
            )}
          </section>

          <ListToolbar defaultValue={q} placeholder="Search skills…">
            <Select name="category" defaultValue={filterCategory} className="h-9 w-auto text-xs sm:w-44" aria-label="Filter by category">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </ListToolbar>

          {skills.length ? (
            <TableShell>
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr>
                    <Th>Skill</Th>
                    <Th>Category</Th>
                    <Th>Level</Th>
                    <Th>Order</Th>
                    <Th>Visible</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((skill) => (
                    <tr key={skill.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                      <Td className="font-medium">{skill.name}</Td>
                      <Td className="text-muted-foreground">{skill.category.name}</Td>
                      <Td>
                        {skill.level === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                              <span className="block h-full rounded-full bg-accent" style={{ width: `${skill.level}%` }} />
                            </span>
                            <span className="tabular-nums text-[10px] text-muted-foreground">{skill.level}</span>
                          </span>
                        )}
                      </Td>
                      <Td className="tabular-nums text-muted-foreground">{skill.sortOrder}</Td>
                      <Td>
                        <ToggleAction
                          id={skill.id}
                          checked={skill.isVisible}
                          action={toggleSkillVisibilityAction}
                          label={`${skill.isVisible ? "Hide" : "Show"} ${skill.name}`}
                        />
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/skills?skill=${skill.id}`}
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Link>
                          <ConfirmDelete
                            id={skill.id}
                            name={skill.name}
                            action={deleteSkillAction}
                            size="icon"
                            description="The skill will be removed from the public site and resume."
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
              icon="Sparkles"
              title={q || selectedCategory ? "No skills match these filters" : "No skills yet"}
              description={
                q || selectedCategory
                  ? "Try clearing the search or choosing another category."
                  : "Add skills to a category so visitors can see what you work with."
              }
              action={
                <Link
                  href={`/admin/skills?skill=new${filterCategory ? `&category=${filterCategory}` : ""}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add skill
                </Link>
              }
            />
          )}
        </div>

        <div>{editor}</div>
      </div>
    </div>
  );
}
