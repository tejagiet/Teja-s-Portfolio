export type ResumeTemplateId = "modern" | "classic" | "minimal" | "compact" | string;

export type ResumeConfig = {
  template: ResumeTemplateId;
  accentColor: string;
  fontFamily: "SANS" | "SERIF";
  fontScale: number;
  showPhoto: boolean;
  showInterests: boolean;
  sectionOrder: string[];
  hiddenSections: string[];
  hiddenItems?: string[];
};

export type ResumeLink = {
  label: string;
  url: string;
  platform: string;
};

export type ResumeProfileSnapshot = {
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string;
  photoUrl: string | null;
  interests: string[];
  links: ResumeLink[];
};

export type ResumeSectionSnapshot = {
  key: string;
  title: string;
  items: Array<Record<string, unknown>>;
};

export type ResumeContent = {
  profile: ResumeProfileSnapshot;
  sections: ResumeSectionSnapshot[];
  generatedAt: string;
};

export type ResumeDiff = {
  summaryChanged: boolean;
  totalChanges: number;
  sections: Array<{
    key: string;
    title: string;
    added: string[];
    removed: string[];
    changed: string[];
  }>;
};

export const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "achievements",
];

export function normalizeResumeConfig(input: unknown): ResumeConfig {
  const raw = (input ?? {}) as Partial<ResumeConfig>;
  const order = Array.isArray(raw.sectionOrder)
    ? raw.sectionOrder.filter((key): key is string => typeof key === "string")
    : DEFAULT_SECTION_ORDER;
  const hidden = Array.isArray(raw.hiddenSections)
    ? raw.hiddenSections.filter((key): key is string => typeof key === "string")
    : [];
  const hiddenItems = Array.isArray(raw.hiddenItems)
    ? raw.hiddenItems.filter((id): id is string => typeof id === "string")
    : [];

  return {
    template: typeof raw.template === "string" ? raw.template : "modern",
    accentColor: /^#[0-9a-f]{6}$/i.test(raw.accentColor ?? "")
      ? (raw.accentColor as string)
      : "#4f46e5",
    fontFamily: raw.fontFamily === "SERIF" ? "SERIF" : "SANS",
    fontScale:
      typeof raw.fontScale === "number" && raw.fontScale >= 0.85 && raw.fontScale <= 1.15
        ? raw.fontScale
        : 1,
    showPhoto: raw.showPhoto !== false,
    showInterests: raw.showInterests !== false,
    sectionOrder: order.length ? order : [...DEFAULT_SECTION_ORDER],
    hiddenSections: hidden,
    hiddenItems,
  };
}

export function parseResumeContent(value: unknown): ResumeContent | null {
  if (!value || typeof value !== "object") return null;
  const content = value as Partial<ResumeContent>;
  if (!content.profile || !Array.isArray(content.sections)) return null;
  return content as ResumeContent;
}
