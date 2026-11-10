import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  DEFAULT_SECTION_ORDER,
  normalizeResumeConfig,
  parseResumeContent,
  type ResumeConfig,
  type ResumeContent,
  type ResumeDiff,
  type ResumeSectionSnapshot,
} from "@/lib/resume-types";
import { RESUME_SECTION_DEFINITIONS } from "@/lib/constants";

const TITLES = Object.fromEntries(
  RESUME_SECTION_DEFINITIONS.map((section) => [section.key, section.title]),
) as Record<string, string>;

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function buildResumeContent(summaryOverride?: string): Promise<ResumeContent> {
  const [profile, experience, education, categories, projects, certifications, achievements] =
    await Promise.all([
      db.profile.findFirst({
        include: {
          socialLinks: {
            where: { isVisible: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      }),
      db.experience.findMany({
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
      }),
      db.education.findMany({
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { startYear: "desc" }],
      }),
      db.skillCategory.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          skills: {
            where: { isVisible: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      }),
      db.project.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      db.certification.findMany({
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { issueDate: "desc" }],
      }),
      db.achievement.findMany({
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { date: "desc" }],
      }),
    ]);

  if (!profile) {
    throw new Error("Create a profile before generating a resume.");
  }

  const summary =
    summaryOverride?.trim() ||
    profile.resumeSummary?.trim() ||
    profile.shortBio?.trim() ||
    profile.about.trim();

  const sections: ResumeSectionSnapshot[] = [
    {
      key: "summary",
      title: TITLES.summary,
      items: [{ id: "summary", text: summary }],
    },
    {
      key: "experience",
      title: TITLES.experience,
      items: experience.map((item) => ({
        id: item.id,
        role: item.role,
        organization: item.organization,
        type: item.type,
        location: item.location,
        startDate: iso(item.startDate),
        endDate: iso(item.endDate),
        isCurrent: item.isCurrent,
        description: item.description,
        highlights: item.highlights,
      })),
    },
    {
      key: "education",
      title: TITLES.education,
      items: education.map((item) => ({
        id: item.id,
        institution: item.institution,
        degree: item.degree,
        field: item.field,
        location: item.location,
        startYear: item.startYear,
        endYear: item.endYear,
        isCurrent: item.isCurrent,
        grade: item.grade,
        description: item.description,
      })),
    },
    {
      key: "skills",
      title: TITLES.skills,
      items: categories
        .filter((category) => category.skills.length > 0)
        .map((category) => ({
          id: category.id,
          name: category.name,
          skills: category.skills.map((skill) => ({
            id: skill.id,
            name: skill.name,
            level: skill.level,
          })),
        })),
    },
    {
      key: "projects",
      title: TITLES.projects,
      items: projects.slice(0, 8).map((project) => ({
        id: project.id,
        title: project.title,
        slug: project.slug,
        description: project.description,
        category: project.category,
        status: project.status,
        techStack: project.techStack,
        liveUrl: project.liveUrl,
        githubUrl: project.githubUrl,
      })),
    },
    {
      key: "certifications",
      title: TITLES.certifications,
      items: certifications.map((item) => ({
        id: item.id,
        title: item.title,
        issuer: item.issuer,
        issueDate: iso(item.issueDate),
        credentialId: item.credentialId,
        credentialUrl: item.credentialUrl,
      })),
    },
    {
      key: "achievements",
      title: TITLES.achievements,
      items: achievements.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        date: iso(item.date),
      })),
    },
  ];

  return {
    profile: {
      name: profile.displayName,
      title: profile.title,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      summary,
      photoUrl: profile.profilePhotoUrl,
      interests: profile.interests,
      links: profile.socialLinks.map((link) => ({
        label: link.label,
        url: link.url,
        platform: link.platform,
      })),
    },
    sections,
    generatedAt: new Date().toISOString(),
  };
}

function itemLabel(key: string, item: Record<string, unknown>): string {
  switch (key) {
    case "experience":
      return `${String(item.role ?? "")} at ${String(item.organization ?? "")}`.trim();
    case "education":
      return [item.degree, item.institution].filter(Boolean).join(" — ");
    case "skills":
      return String(item.name ?? "Skill category");
    case "projects":
      return String(item.title ?? "Project");
    case "certifications":
      return String(item.title ?? "Certification");
    case "achievements":
      return String(item.title ?? "Achievement");
    case "summary":
      return "Professional summary";
    default:
      return String(item.id ?? "Item");
  }
}

function sectionSignature(key: string, item: Record<string, unknown>) {
  const { id: _id, ...rest } = item;
  return JSON.stringify(rest);
}

export function diffResumeContent(previous: ResumeContent, next: ResumeContent): ResumeDiff {
  const sections: ResumeDiff["sections"] = [];
  let totalChanges = 0;
  let summaryChanged = false;

  const previousSections = new Map(previous.sections.map((section) => [section.key, section]));
  for (const section of next.sections) {
    const before = previousSections.get(section.key);
    if (!before) {
      if (section.items.length) {
        sections.push({
          key: section.key,
          title: section.title,
          added: section.items.map((item) => itemLabel(section.key, item)),
          removed: [],
          changed: [],
        });
        totalChanges += section.items.length;
      }
      continue;
    }

    const beforeMap = new Map(before.items.map((item) => [String(item.id), item]));
    const afterMap = new Map(section.items.map((item) => [String(item.id), item]));
    const added: string[] = [];
    const removed: string[] = [];
    const changed: string[] = [];

    for (const item of section.items) {
      const id = String(item.id);
      const oldItem = beforeMap.get(id);
      if (!oldItem) added.push(itemLabel(section.key, item));
      else if (sectionSignature(section.key, oldItem) !== sectionSignature(section.key, item)) {
        changed.push(itemLabel(section.key, item));
      }
    }
    for (const item of before.items) {
      if (!afterMap.has(String(item.id))) removed.push(itemLabel(section.key, item));
    }

    if (section.key === "summary") {
      summaryChanged =
        JSON.stringify(before.items) !== JSON.stringify(section.items) &&
        before.items[0]?.text !== section.items[0]?.text;
    }

    if (added.length || removed.length || changed.length) {
      sections.push({ key: section.key, title: section.title, added, removed, changed });
      totalChanges += added.length + removed.length + changed.length;
    }
  }

  return { summaryChanged, totalChanges, sections };
}

async function writeSections(
  tx: Prisma.TransactionClient,
  versionId: string,
  content: ResumeContent,
  config: ResumeConfig,
) {
  await tx.resumeSection.deleteMany({ where: { versionId } });
  const ordered = config.sectionOrder
    .map((key) => content.sections.find((section) => section.key === key))
    .filter((section): section is ResumeSectionSnapshot => Boolean(section));

  await tx.resumeSection.createMany({
    data: ordered.map((section, index) => {
      const isVisible = !config.hiddenSections.includes(section.key);
      const items = config.hiddenItems?.length
        ? section.items.filter((item) => !config.hiddenItems!.includes(String(item.id)))
        : section.items;

      return {
        versionId,
        key: section.key,
        title: section.title,
        sortOrder: index,
        isVisible,
        content: items as Prisma.InputJsonValue,
      };
    }),
  });
}

async function nextVersionNumber() {
  const latest = await db.resumeVersion.aggregate({ _max: { version: true } });
  return (latest._max.version ?? 0) + 1;
}

async function getDefaultTemplate(templateId?: string) {
  if (templateId) {
    const template = await db.resumeTemplate.findUnique({ where: { id: templateId } });
    if (template) return template;
  }
  return db.resumeTemplate.findFirst({
    where: { isDefault: true },
    orderBy: { createdAt: "asc" },
  });
}

export type GenerateResult =
  | { created: false; reason: string }
  | { created: true; versionId: string; version: number; outdated: boolean };

export async function createResumeDraft(options: {
  actorId: string;
  templateId?: string;
  title?: string;
  autoGenerated?: boolean;
}): Promise<GenerateResult> {
  const template = await getDefaultTemplate(options.templateId);
  if (!template) {
    return { created: false, reason: "No resume template exists. Create a template first." };
  }

  const published = await db.resumeVersion.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  const publishedContent = published ? parseResumeContent(published.content) : null;
  const content = await buildResumeContent();
  const config: ResumeConfig = {
    ...normalizeResumeConfig({
      template: template.layout,
      accentColor: template.accentColor,
      fontFamily: template.fontFamily,
    }),
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  };

  if (options.autoGenerated && published) {
    const existingDraft = await db.resumeVersion.findFirst({
      where: { status: "DRAFT", autoGenerated: true },
      orderBy: { createdAt: "desc" },
    });

    if (existingDraft) {
      await db.resumeVersion.update({
        where: { id: existingDraft.id },
        data: {
          content: content as unknown as Prisma.InputJsonValue,
          diff: (publishedContent
            ? diffResumeContent(publishedContent, content)
            : undefined) as unknown as Prisma.InputJsonValue,
          outdated: false,
          generatedAt: new Date(),
        },
      });
      await db.$transaction(async (tx) => {
        await writeSections(tx, existingDraft.id, content, normalizeResumeConfig(existingDraft.config));
      });
      await db.resumeVersion.updateMany({
        where: { status: "PUBLISHED" },
        data: { outdated: true },
      });
      return {
        created: true,
        versionId: existingDraft.id,
        version: existingDraft.version,
        outdated: false,
      };
    }
  }

  const version = await nextVersionNumber();
  const diff = publishedContent ? diffResumeContent(publishedContent, content) : null;

  const draft = await db.resumeVersion.create({
    data: {
      templateId: template.id,
      createdById: options.actorId,
      version,
      title: options.title?.trim() || (options.autoGenerated ? "Auto-generated update" : `Resume v${version}`),
      status: "DRAFT",
      summary: content.profile.summary,
      config: config as unknown as Prisma.InputJsonValue,
      content: content as unknown as Prisma.InputJsonValue,
      diff: diff ? (diff as unknown as Prisma.InputJsonValue) : undefined,
      autoGenerated: options.autoGenerated ?? false,
      generatedAt: new Date(),
    },
  });

  await db.$transaction(async (tx) => {
    await writeSections(tx, draft.id, content, config);
  });

  if (published) {
    await db.resumeVersion.updateMany({
      where: { status: "PUBLISHED" },
      data: { outdated: true },
    });
  }

  return { created: true, versionId: draft.id, version, outdated: false };
}

/**
 * Called after professional content changes. Marks the approved resume as
 * outdated and refreshes (or creates) a single auto-generated review draft.
 */
export async function syncResumeState(actorId: string) {
  try {
    const published = await db.resumeVersion.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
    });
    if (!published) return;

    await db.resumeVersion.updateMany({
      where: { status: "PUBLISHED" },
      data: { outdated: true },
    });

    await createResumeDraft({ actorId, autoGenerated: true });
  } catch (error) {
    console.error("[resume-sync]", error);
  }
}

export async function refreshDraftContent(versionId: string, summary?: string) {
  const draft = await db.resumeVersion.findUnique({ where: { id: versionId } });
  if (!draft) throw new Error("Resume version not found.");
  if (draft.status !== "DRAFT") throw new Error("Only drafts can be refreshed.");

  const content = await buildResumeContent(summary ?? draft.summary ?? undefined);
  const config = normalizeResumeConfig(draft.config);

  await db.resumeVersion.update({
    where: { id: versionId },
    data: {
      content: content as unknown as Prisma.InputJsonValue,
      summary: content.profile.summary,
      generatedAt: new Date(),
    },
  });
  await db.$transaction(async (tx) => {
    await writeSections(tx, versionId, content, config);
  });
  return content;
}

export async function updateDraftConfig(
  versionId: string,
  configInput: unknown,
  summary?: string,
) {
  const draft = await db.resumeVersion.findUnique({ where: { id: versionId } });
  if (!draft) throw new Error("Resume version not found.");
  if (draft.status !== "DRAFT") throw new Error("Only draft versions can be edited.");

  const config = normalizeResumeConfig(configInput);
  const content = parseResumeContent(draft.content);
  if (!content) throw new Error("Resume snapshot is invalid.");

  if (typeof summary === "string") {
    content.profile.summary = summary;
    const summarySection = content.sections.find((section) => section.key === "summary");
    if (summarySection) summarySection.items = [{ id: "summary", text: summary }];
  }

  await db.resumeVersion.update({
    where: { id: versionId },
    data: {
      config: config as unknown as Prisma.InputJsonValue,
      content: content as unknown as Prisma.InputJsonValue,
      summary: content.profile.summary,
    },
  });
  await db.$transaction(async (tx) => {
    await writeSections(tx, versionId, content, config);
  });
  return { config, content };
}

export async function publishResumeVersion(versionId: string) {
  const version = await db.resumeVersion.findUnique({ where: { id: versionId } });
  if (!version) throw new Error("Resume version not found.");
  if (version.status === "ARCHIVED") throw new Error("Archived versions cannot be published.");

  await db.$transaction(async (tx) => {
    await tx.resumeVersion.updateMany({
      where: { status: "PUBLISHED", NOT: { id: versionId } },
      data: { status: "ARCHIVED", outdated: false },
    });
    await tx.resumeVersion.update({
      where: { id: versionId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        outdated: false,
      },
    });
  });

  return version;
}

export async function getLatestPublishedResume() {
  return db.resumeVersion.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { template: true },
  });
}
