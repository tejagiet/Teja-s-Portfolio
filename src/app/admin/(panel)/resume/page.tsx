import type { Metadata } from "next";
import Link from "next/link";
import {
  Archive,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  History,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ColorInput } from "@/components/admin/color-input";
import { EditorPanel } from "@/components/admin/collection";
import { PageHeader } from "@/components/admin/page-header";
import { ResumeStudio } from "@/components/admin/resume-studio";
import { Panel } from "@/components/admin/stat-card";
import { ResumeDocument } from "@/components/public/resume-document";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  archiveResumeAction,
  deleteResumeTemplateAction,
  deleteResumeVersionAction,
  generateResumeAction,
  publishResumeAction,
  refreshResumeAction,
  saveResumeTemplateAction,
  setDefaultResumeTemplateAction,
} from "@/lib/actions/resume";
import { RESUME_TEMPLATE_LAYOUTS } from "@/lib/constants";
import { db } from "@/lib/db";
import type { ResumeDiff } from "@/lib/resume-types";
import { formatDateTime, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Resume builder" };

export const dynamic = "force-dynamic";

const STATUS = {
  DRAFT: { label: "Draft", tone: "warning" as const },
  PUBLISHED: { label: "Approved", tone: "success" as const },
  ARCHIVED: { label: "Archived", tone: "neutral" as const },
};

const LAYOUT_LABEL = Object.fromEntries(
  RESUME_TEMPLATE_LAYOUTS.map((layout) => [layout.value, layout.label]),
) as Record<string, string>;

function DiffPanel({ diff }: { diff: ResumeDiff | null }) {
  if (!diff) {
    return (
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        There is no published version to compare against, so no diff is available yet.
      </p>
    );
  }

  if (!diff.totalChanges) {
    return (
      <p className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        This snapshot matches the current published resume.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-muted-foreground">
        {diff.totalChanges} change{diff.totalChanges === 1 ? "" : "s"} compared with the published resume
        {diff.summaryChanged ? " · summary changed" : ""}.
      </p>
      {diff.sections.map((section) => (
        <div key={section.key} className="rounded-xl border border-border p-2.5">
          <p className="text-[11px] font-medium">{section.title}</p>
          <div className="mt-1 space-y-1 text-[10px] leading-relaxed">
            {section.added.length ? (
              <p className="text-emerald-700 dark:text-emerald-300">
                <span className="font-medium">Added:</span> {section.added.join(", ")}
              </p>
            ) : null}
            {section.changed.length ? (
              <p className="text-amber-700 dark:text-amber-300">
                <span className="font-medium">Changed:</span> {section.changed.join(", ")}
              </p>
            ) : null}
            {section.removed.length ? (
              <p className="text-red-700 dark:text-red-300">
                <span className="font-medium">Removed:</span> {section.removed.join(", ")}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ResumeBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; version?: string; template?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "templates" || params.template ? "templates" : "versions";

  const [versions, templates] = await Promise.all([
    db.resumeVersion.findMany({
      orderBy: { version: "desc" },
      take: 60,
      include: { template: { select: { name: true, layout: true, accentColor: true } } },
    }),
    db.resumeTemplate.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { versions: true } } },
    }),
  ]);

  const published = versions.find((version) => version.status === "PUBLISHED") || null;
  const drafts = versions.filter((version) => version.status === "DRAFT");
  const selected =
    (params.version ? versions.find((version) => version.id === params.version) : null) ||
    published ||
    drafts[0] ||
    versions[0] ||
    null;

  const templateParam = params.template;
  const editingTemplate =
    templateParam && templateParam !== "new"
      ? templates.find((template) => template.id === templateParam) || null
      : null;
  const templateEditorOpen = Boolean(templateParam);

  return (
    <div>
      <PageHeader
        eyebrow="Publishing"
        title="Resume builder"
        description="Generate a snapshot from the current portfolio content, adjust its design and sections, then approve it. The public download always serves the latest approved version."
        actions={
          <>
            <Link
              href="/admin/resume?tab=templates"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Templates
            </Link>
            <Link
              href="/resume"
              target="_blank"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Public resume
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[
          { value: "versions", label: "Versions", href: "/admin/resume" },
          { value: "templates", label: "Templates", href: "/admin/resume?tab=templates" },
        ].map((entry) => (
          <Link
            key={entry.value}
            href={entry.href}
            className={`inline-flex h-8 items-center rounded-lg border px-3 text-[11px] font-medium transition-colors ${
              tab === entry.value
                ? "border-accent/30 bg-accent-soft text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {entry.label}
          </Link>
        ))}
        <span className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[10px] text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden />
          {published ? `Public: v${published.version}` : "No approved resume"}
        </span>
      </div>

      {tab === "templates" ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div>
            <Panel
              title="Resume templates"
              description="Templates define the default layout, accent colour and typeface for new drafts. Templates in use cannot be deleted."
              action={
                <Link
                  href="/admin/resume?tab=templates&template=new"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-2.5 text-[11px] font-medium text-accent-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New template
                </Link>
              }
            >
              {templates.length ? (
                <ul className="divide-y divide-border">
                  {templates.map((template) => (
                    <li key={template.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold text-white"
                        style={{ backgroundColor: template.accentColor }}
                        aria-hidden
                      >
                        {LAYOUT_LABEL[template.layout]?.slice(0, 1) || "R"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                          {template.name}
                          {template.isDefault ? <Badge tone="accent">Default</Badge> : null}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {LAYOUT_LABEL[template.layout] || template.layout} ·{" "}
                          {template.fontFamily === "SERIF" ? "Serif" : "Sans"} · {template.accentColor} ·{" "}
                          {template._count.versions} version{template._count.versions === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!template.isDefault ? (
                          <ActionButton
                            action={setDefaultResumeTemplateAction.bind(null, template.id)}
                            label="Make default"
                            size="sm"
                          />
                        ) : null}
                        <Link
                          href={`/admin/resume?tab=templates&template=${template.id}`}
                          className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Edit
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon="FileText"
                  title="No resume templates"
                  description="Create a template to control the default layout, accent colour and typeface of generated resumes."
                  action={
                    <Link
                      href="/admin/resume?tab=templates&template=new"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New template
                    </Link>
                  }
                />
              )}
            </Panel>
          </div>

          <div className="xl:sticky xl:top-20">
            {templateEditorOpen ? (
              <EditorPanel
                title={editingTemplate ? "Edit template" : "New template"}
                description="Layouts affect the HTML preview and generate the PDF with a matching visual style."
                closeHref="/admin/resume?tab=templates"
                tone="accent"
              >
                <ActionForm
                  action={saveResumeTemplateAction}
                  submitLabel={editingTemplate ? "Save template" : "Create template"}
                  footerClassName="mt-4 flex items-center justify-end border-t border-border pt-4"
                >
                  {editingTemplate ? <input type="hidden" name="id" value={editingTemplate.id} /> : null}
                  <div className="space-y-3">
                    <Field label="Template name" htmlFor="template-name">
                      <Input
                        id="template-name"
                        name="name"
                        defaultValue={editingTemplate?.name || ""}
                        required
                        maxLength={80}
                      />
                    </Field>
                    <Field label="Description" htmlFor="template-description">
                      <Textarea
                        id="template-description"
                        name="description"
                        defaultValue={editingTemplate?.description || ""}
                        maxLength={300}
                        className="min-h-20"
                      />
                    </Field>
                    <Field label="Layout" htmlFor="template-layout">
                      <Select id="template-layout" name="layout" defaultValue={editingTemplate?.layout || "modern"}>
                        {RESUME_TEMPLATE_LAYOUTS.map((layout) => (
                          <option key={layout.value} value={layout.value}>
                            {layout.label} — {layout.description}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <div>
                      <p className="mb-1.5 text-xs font-medium">Accent colour</p>
                      <ColorInput defaultValue={editingTemplate?.accentColor || "#4f46e5"} />
                    </div>
                    <Field label="Typeface" htmlFor="template-font">
                      <Select
                        id="template-font"
                        name="fontFamily"
                        defaultValue={editingTemplate?.fontFamily === "SERIF" ? "SERIF" : "SANS"}
                      >
                        <option value="SANS">Sans serif</option>
                        <option value="SERIF">Serif</option>
                      </Select>
                    </Field>
                    <Checkbox
                      name="isDefault"
                      label="Default template"
                      description="New drafts use this template. The current default remains default until another template is selected."
                      defaultChecked={editingTemplate ? editingTemplate.isDefault : templates.length === 0}
                    />
                    {editingTemplate ? (
                      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                        <span className="text-[10px] text-muted-foreground">
                          {editingTemplate._count.versions} version{editingTemplate._count.versions === 1 ? "" : "s"} use
                          this template.
                        </span>
                        <ConfirmDelete
                          id={editingTemplate.id}
                          name={editingTemplate.name}
                          action={deleteResumeTemplateAction}
                          redirectTo="/admin/resume?tab=templates"
                          description="Templates used by existing resume versions cannot be deleted. Choose a new default first if needed."
                        />
                      </div>
                    ) : null}
                  </div>
                </ActionForm>
              </EditorPanel>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
                <p className="text-xs font-semibold text-foreground">Template notes</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4">
                  <li>The default template seeds the design of each newly generated draft.</li>
                  <li>Every draft can still override the layout, accent, typeface and section order.</li>
                  <li>Deleting a template is blocked while resume versions reference it.</li>
                  <li>Select a template to edit its settings.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="space-y-4 xl:sticky xl:top-20">
            <Panel title="Generate a draft" description="Snapshots the current published portfolio content.">
              {templates.length ? (
                <ActionForm action={generateResumeAction} submitLabel="Generate draft" pendingLabel="Generating…">
                  <div className="space-y-3">
                    <Field label="Title" htmlFor="generate-title" hint="Optional. Defaults to “Resume vN”.">
                      <Input id="generate-title" name="title" maxLength={120} placeholder="Resume v2" />
                    </Field>
                    <Field label="Template" htmlFor="generate-template">
                      <Select id="generate-template" name="templateId" defaultValue="">
                        <option value="">Default template</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </ActionForm>
              ) : (
                <EmptyState
                  compact
                  icon="FileText"
                  title="Create a template first"
                  description="A resume draft needs a template. Add one from the Templates tab, then generate a draft."
                  action={
                    <Link
                      href="/admin/resume?tab=templates&template=new"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New template
                    </Link>
                  }
                />
              )}
            </Panel>

            <Panel
              title="Version history"
              description="Newest first. Status reflects approval, not editing."
              action={<History className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
            >
              {versions.length ? (
                <ul className="-mx-1 space-y-1">
                  {versions.map((version) => {
                    const active = selected?.id === version.id;
                    return (
                      <li key={version.id}>
                        <Link
                          href={`/admin/resume?version=${version.id}`}
                          className={`block rounded-xl border px-2.5 py-2 transition-colors ${
                            active
                              ? "border-accent/30 bg-accent-soft/70"
                              : "border-transparent hover:border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              v{version.version}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                              {version.title}
                            </span>
                            <Badge tone={STATUS[version.status].tone}>{STATUS[version.status].label}</Badge>
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-muted-foreground">
                            <span>{formatDate(version.generatedAt)}</span>
                            {version.autoGenerated ? <span>· Auto</span> : null}
                            {version.outdated ? (
                              <span className="font-medium text-amber-600 dark:text-amber-400">· Outdated</span>
                            ) : null}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  No resume versions yet. Generate the first draft from the panel above.
                </p>
              )}
            </Panel>

            <div className="rounded-2xl border border-border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
              <p className="text-xs font-semibold text-foreground">How approval works</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-4">
                <li>Drafts are editable but never public.</li>
                <li>Approving a draft archives the previously published version.</li>
                <li>Published resumes are marked outdated when portfolio content changes.</li>
                <li>Auto-generated drafts keep the review queue to a single entry.</li>
              </ul>
            </div>
          </div>

          <div className="min-w-0">
            {selected ? (
              <div className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="text-sm font-semibold tracking-tight">{selected.title}</h2>
                        <Badge tone={STATUS[selected.status].tone}>{STATUS[selected.status].label}</Badge>
                        {selected.autoGenerated ? <Badge tone="neutral">Auto-generated</Badge> : null}
                        {selected.outdated ? <Badge tone="warning">Outdated</Badge> : null}
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Version {selected.version} · {selected.template.name} · generated{" "}
                        {formatDateTime(selected.generatedAt)}
                        {selected.publishedAt ? ` · published ${formatDateTime(selected.publishedAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <a
                        href={`/api/admin/resume/${selected.id}/pdf`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden />
                        PDF
                      </a>
                      {selected.status !== "ARCHIVED" ? (
                        <ActionButton
                          action={archiveResumeAction.bind(null, selected.id)}
                          label="Archive"
                          icon={<Archive className="h-3.5 w-3.5" aria-hidden />}
                        />
                      ) : null}
                      {selected.status !== "PUBLISHED" ? (
                        <ConfirmDelete
                          id={selected.id}
                          name={`resume v${selected.version}`}
                          action={deleteResumeVersionAction}
                          redirectTo="/admin/resume"
                          description="The version snapshot and its sections are deleted. Publish another version before deleting the approved resume."
                        />
                      ) : null}
                    </div>
                  </div>

                  {selected.status === "PUBLISHED" ? (
                    <div className="border-b border-border bg-emerald-500/5 px-5 py-3 text-[11px] text-emerald-700 dark:text-emerald-300">
                      This approved version is served by the public resume page and PDF download. Archive it only after
                      publishing a replacement.
                    </div>
                  ) : null}

                  {selected.status === "DRAFT" ? (
                    <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2">
                      <ActionForm
                        action={refreshResumeAction}
                        submitLabel="Refresh snapshot"
                        pendingLabel="Refreshing…"
                        footerClassName="mt-2 flex items-center justify-end"
                      >
                        <input type="hidden" name="versionId" value={selected.id} />
                        <p className="mb-2 flex items-center gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
                          <RefreshCw className="h-3 w-3" aria-hidden />
                          Replace this draft&apos;s content with the latest published profile, projects, skills and
                          education. Design settings are preserved.
                        </p>
                      </ActionForm>
                      <ActionForm
                        action={publishResumeAction}
                        submitLabel="Approve & publish"
                        pendingLabel="Publishing…"
                        footerClassName="mt-2 flex items-center justify-end"
                      >
                        <input type="hidden" name="versionId" value={selected.id} />
                        <p className="mb-2 flex items-center gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" aria-hidden />
                          Approve this draft and make it the public download. The previous version is archived.
                        </p>
                      </ActionForm>
                    </div>
                  ) : null}

                  {selected.status === "DRAFT" ? (
                    <div className="p-4">
                      <ResumeStudio
                        versionId={selected.id}
                        title={selected.title}
                        summary={selected.summary}
                        config={selected.config}
                        content={selected.content}
                      />
                    </div>
                  ) : (
                    <div className="grid gap-4 p-4 2xl:grid-cols-[minmax(0,1fr)_19rem]">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold">Snapshot preview</p>
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            {selected.template.layout} ·{" "}
                            {selected.status === "PUBLISHED" ? "Approved" : "Archived"}
                          </span>
                        </div>
                        <div className="max-h-[80vh] overflow-auto rounded-2xl border border-border bg-neutral-200/60 p-3 dark:bg-neutral-900/60">
                          <div className="mx-auto w-full max-w-[210mm] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.45)]">
                            <ResumeDocument content={selected.content} config={selected.config} />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="mb-2 text-xs font-semibold">Changes since previous approval</p>
                          <DiffPanel diff={(selected.diff as unknown as ResumeDiff | null) || null} />
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
                          <p className="font-medium text-foreground">Read-only snapshot</p>
                          <p className="mt-1">
                            Published and archived versions are immutable. Generate a new draft to change the design
                            or content.
                          </p>
                          <p className="mt-2 flex items-center gap-1.5">
                            <FileText className="h-3 w-3" aria-hidden />
                            {selected.status === "PUBLISHED" ? "Served publicly" : "Not served publicly"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {selected.status === "DRAFT" ? (
                  <Panel
                    title="Changes since previous approval"
                    description="Calculated against the most recently published snapshot when this draft was generated or refreshed."
                  >
                    <DiffPanel diff={(selected.diff as unknown as ResumeDiff | null) || null} />
                  </Panel>
                ) : null}
              </div>
            ) : (
              <EmptyState
                icon="FileText"
                title="No resume versions yet"
                description="Generate a draft from the current portfolio content to create the first version. Nothing is published until you approve it."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
