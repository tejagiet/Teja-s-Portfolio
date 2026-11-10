import type { ProjectStatus } from "@prisma/client";

export const SITE_NAME = "Teja Manikanta";

export const PUBLIC_NAV = [
  { href: "/#about", label: "About" },
  { href: "/#skills", label: "Skills" },
  { href: "/projects", label: "Projects" },
  { href: "/#experience", label: "Experience" },
  { href: "/#contact", label: "Contact" },
];

export const PROJECT_STATUS: Record<
  ProjectStatus,
  { label: string; tone: string; description: string }
> = {
  CONCEPT: {
    label: "Concept",
    tone: "bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300",
    description: "Recorded as a concept. Implementation details have not been documented yet.",
  },
  IN_DEVELOPMENT: {
    label: "In development",
    tone: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    description: "Actively being developed.",
  },
  BETA: {
    label: "Beta",
    tone: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
    description: "Available in beta. Features may change.",
  },
  COMPLETED: {
    label: "Completed",
    tone: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    description: "Completed and released.",
  },
  MAINTAINED: {
    label: "Maintained",
    tone: "bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:text-teal-300",
    description: "Released and actively maintained.",
  },
  ARCHIVED: {
    label: "Archived",
    tone: "bg-stone-500/10 text-stone-700 ring-stone-500/20 dark:text-stone-300",
    description: "No longer actively maintained.",
  },
};

export const EXPERIENCE_TYPES = [
  { value: "WORK", label: "Work" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "OPEN_SOURCE", label: "Open source" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "OTHER", label: "Other" },
] as const;

export const PROJECT_STATUS_OPTIONS = (
  Object.keys(PROJECT_STATUS) as ProjectStatus[]
).map((value) => ({ value, label: PROJECT_STATUS[value].label }));

export const SEO_PAGES = [
  { key: "home", path: "/", label: "Home" },
  { key: "projects", path: "/projects", label: "Projects" },
  { key: "resume", path: "/resume", label: "Resume" },
  { key: "contact", path: "/contact", label: "Contact" },
] as const;

export type SeoPageKey = (typeof SEO_PAGES)[number]["key"];

export const RESUME_SECTION_DEFINITIONS = [
  {
    key: "summary",
    title: "Professional Summary",
    description: "A concise introduction shown at the top of the resume.",
  },
  {
    key: "experience",
    title: "Experience",
    description: "Published experience entries from the portfolio.",
  },
  {
    key: "education",
    title: "Education",
    description: "Published education entries from the portfolio.",
  },
  {
    key: "skills",
    title: "Technical Skills",
    description: "Visible skills grouped by category.",
  },
  {
    key: "projects",
    title: "Selected Projects",
    description: "Published projects, with featured projects first.",
  },
  {
    key: "certifications",
    title: "Certifications",
    description: "Published certifications.",
  },
  {
    key: "achievements",
    title: "Achievements",
    description: "Published achievements.",
  },
] as const;

export const RESUME_TEMPLATE_LAYOUTS = [
  { value: "modern", label: "Modern", description: "Accent header with a clean single column." },
  { value: "classic", label: "Classic", description: "Traditional centered header and serif type." },
  { value: "minimal", label: "Minimal", description: "Quiet typography and generous whitespace." },
  { value: "compact", label: "Compact", description: "Denser layout for longer career histories." },
] as const;

export const FOCUS_AREAS = [
  "Full-stack application development",
  "Backend engineering and API development",
  "Database architecture",
  "Cloud infrastructure and DevOps",
  "AI-powered applications",
  "Android application development",
  "Software and hardware integration",
];

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: "LayoutDashboard" },
  { href: "/admin/projects", label: "Projects", icon: "FolderKanban" },
  { href: "/admin/skills", label: "Skills", icon: "Sparkles" },
  { href: "/admin/experience", label: "Experience", icon: "Briefcase" },
  { href: "/admin/education", label: "Education", icon: "GraduationCap" },
  { href: "/admin/certifications", label: "Certifications", icon: "BadgeCheck" },
  { href: "/admin/services", label: "Services", icon: "Layers" },
  { href: "/admin/achievements", label: "Achievements", icon: "Trophy" },
  { href: "/admin/resume", label: "Resume builder", icon: "FileText" },
  { href: "/admin/seo", label: "SEO manager", icon: "Search" },
  { href: "/admin/messages", label: "Messages", icon: "Mail" },
  { href: "/admin/analytics", label: "Analytics", icon: "ChartNoAxesCombined" },
  { href: "/admin/media", label: "Media library", icon: "Images" },
  { href: "/admin/settings", label: "Website settings", icon: "Settings" },
] as const;

export const CLOUDINARY_HOST = "res.cloudinary.com";
