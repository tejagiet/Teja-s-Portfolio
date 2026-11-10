import { z } from "zod";

import { splitList } from "@/lib/utils";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[]>;
  data?: Record<string, unknown>;
};

export const initialActionState: ActionState = { status: "idle" };

export function actionError(message: string, errors?: Record<string, string[] | undefined>): ActionState {
  const cleaned: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors ?? {})) {
    if (value?.length) cleaned[key] = value;
  }
  return { status: "error", message, errors: Object.keys(cleaned).length ? cleaned : undefined };
}

export function actionSuccess(message: string, data?: Record<string, unknown>): ActionState {
  return { status: "success", message, data };
}

export function zodError(error: z.ZodError): ActionState {
  const flat = error.flatten();
  return actionError("Please correct the highlighted fields.", flat.fieldErrors as Record<string, string[]>);
}

export function fdString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function fdOptional(formData: FormData, key: string) {
  const value = fdString(formData, key);
  return value || null;
}

export function fdBool(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function fdNumber(formData: FormData, key: string, fallback: number | null = null) {
  const value = fdString(formData, key);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function fdList(formData: FormData, key: string) {
  return splitList(fdString(formData, key));
}

export function fdDate(formData: FormData, key: string) {
  const value = fdString(formData, key);
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const optionalText = (max = 500) => z.string().trim().max(max).nullable().optional();
const optionalUrl = z
  .union([z.string().trim().url("Enter a valid URL.").max(600), z.literal("")])
  .nullable()
  .optional();

export const optionalMonthSchema = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, "Use a valid date.").nullable().optional();

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(200);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(300),
});

export const setupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(80),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(200)
      .regex(/[a-z]/, "Include a lowercase letter.")
      .regex(/[A-Z]/, "Include an uppercase letter.")
      .regex(/[0-9]/, "Include a number."),
    confirm: z.string(),
    token: z.string().min(1, "Enter the setup token."),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  title: z.string().trim().min(2).max(160),
  tagline: optionalText(200),
  shortBio: optionalText(500),
  about: z.string().trim().min(20, "Add a little more detail (at least 20 characters).").max(6000),
  email: z.union([emailSchema, z.literal("")]).nullable().optional(),
  phone: optionalText(50),
  location: optionalText(120),
  availability: optionalText(160),
  profilePhotoUrl: optionalText(600),
  aboutPhotoUrl: optionalText(600),
  resumeSummary: optionalText(2000),
  interests: z.array(z.string().max(100)).max(30),
});

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(60),
  url: z.string().trim().url("Enter a valid URL.").max(600),
  icon: optionalText(50),
  sortOrder: z.number().int().min(0).max(999),
  isVisible: z.boolean(),
});

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Enter a project title.").max(140),
  slug: z
    .string()
    .trim()
    .max(90)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.")
    .nullable()
    .optional(),
  subtitle: optionalText(200),
  description: z.string().trim().min(20, "Add a short description (at least 20 characters).").max(1200),
  content: z.string().trim().max(20000),
  category: z.string().trim().min(1, "Choose a category.").max(60),
  status: z.enum(["CONCEPT", "IN_DEVELOPMENT", "BETA", "COMPLETED", "MAINTAINED", "ARCHIVED"]),
  featured: z.boolean(),
  published: z.boolean(),
  coverImageUrl: optionalText(600),
  coverImageAlt: optionalText(300),
  githubUrl: optionalUrl,
  liveUrl: optionalUrl,
  techStack: z.array(z.string().max(60)).max(40),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999),
});

const imageUrlSchema = z
  .string()
  .trim()
  .max(600)
  .refine(
    (value) => /^https?:\/\//i.test(value) || (value.startsWith("/") && !value.startsWith("//")),
    "Enter an absolute URL or a root-relative path.",
  );

export const projectImageSchema = z.object({
  projectId: z.string().min(1),
  url: imageUrlSchema,
  altText: z.string().trim().min(1, "Alt text is required.").max(300),
});

export const skillCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.")
    .nullable()
    .optional(),
  description: optionalText(300),
  sortOrder: z.number().int().min(0).max(999),
});

export const skillSchema = z.object({
  categoryId: z.string().min(1, "Choose a category."),
  name: z.string().trim().min(1).max(80),
  level: z.number().int().min(0).max(100).nullable().optional(),
  icon: optionalText(50),
  sortOrder: z.number().int().min(0).max(999),
  isVisible: z.boolean(),
});

export const experienceSchema = z.object({
  role: z.string().trim().min(1).max(120),
  organization: z.string().trim().min(1).max(120),
  type: z.enum(["WORK", "INTERNSHIP", "OPEN_SOURCE", "VOLUNTEER", "OTHER"]),
  location: optionalText(120),
  startDate: z.date({ message: "Enter a start date." }),
  endDate: z.date().nullable().optional(),
  isCurrent: z.boolean(),
  description: z.string().trim().min(10).max(4000),
  highlights: z.array(z.string().max(300)).max(12),
  sortOrder: z.number().int().min(0).max(999),
  published: z.boolean(),
});

export const educationSchema = z.object({
  institution: z.string().trim().min(1).max(160),
  degree: z.string().trim().min(1).max(160),
  field: optionalText(160),
  location: optionalText(120),
  startYear: z.number().int().min(1950).max(2100).nullable().optional(),
  endYear: z.number().int().min(1950).max(2100).nullable().optional(),
  isCurrent: z.boolean(),
  grade: optionalText(60),
  description: optionalText(2000),
  sortOrder: z.number().int().min(0).max(999),
  published: z.boolean(),
});

export const certificationSchema = z.object({
  title: z.string().trim().min(1).max(160),
  issuer: z.string().trim().min(1).max(160),
  issueDate: z.date().nullable().optional(),
  expiryDate: z.date().nullable().optional(),
  credentialId: optionalText(160),
  credentialUrl: optionalUrl,
  imageUrl: optionalText(600),
  sortOrder: z.number().int().min(0).max(999),
  published: z.boolean(),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(10).max(2000),
  icon: optionalText(50),
  features: z.array(z.string().max(120)).max(12),
  priceNote: optionalText(100),
  sortOrder: z.number().int().min(0).max(999),
  published: z.boolean(),
});

export const achievementSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(5).max(2000),
  date: z.date().nullable().optional(),
  icon: optionalText(50),
  sortOrder: z.number().int().min(0).max(999),
  published: z.boolean(),
});

export const seoPageSchema = z.object({
  pageKey: z.string().min(1).max(80),
  title: z.string().trim().min(1, "Enter a page title.").max(120),
  description: z.string().trim().min(20, "Write a description of at least 20 characters.").max(400),
  keywords: z.array(z.string().max(80)).max(30),
  ogImageUrl: optionalText(600),
  canonicalUrl: optionalUrl,
  noIndex: z.boolean(),
});

export const redirectSchema = z.object({
  source: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/[a-zA-Z0-9\-._~!$&'()*+,;=:@%/?]*$/, "Use a root-relative path, e.g. /old-page."),
  destination: z
    .string()
    .trim()
    .max(600)
    .regex(
      /^(\/[a-zA-Z0-9\-._~!$&'()*+,;=:@%/?]*|https?:\/\/\S+)$/,
      "Use a root-relative path or a full URL.",
    ),
  permanent: z.boolean(),
});

export const settingsSchema = z.object({
  siteName: z.string().trim().min(1).max(100),
  siteDescription: z.string().trim().min(20).max(500),
  siteUrl: z.string().trim().url().max(300),
  footerNote: optionalText(300),
  contactEmail: z.union([emailSchema, z.literal("")]).nullable().optional(),
  availabilityNote: optionalText(200),
  defaultSocialImage: optionalText(600),
  analyticsId: z
    .union([
      z
        .string()
        .trim()
        .regex(/^G(TM)?-[A-Z0-9]{4,20}$/i, "Use a GA4 ID (G-XXXXXXXXXX) or GTM ID (GTM-XXXXXXX)."),
      z.literal(""),
    ])
    .nullable()
    .optional(),
  googleVerification: optionalText(300),
  bingVerification: optionalText(300),
  resumePublicEnabled: z.boolean(),
  maintenanceMode: z.boolean(),
});

export const accountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  image: optionalText(600),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(200)
      .regex(/[a-z]/, "Include a lowercase letter.")
      .regex(/[A-Z]/, "Include an uppercase letter.")
      .regex(/[0-9]/, "Include a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: emailSchema,
  subject: z.string().trim().min(3, "Enter a subject.").max(160),
  message: z
    .string()
    .trim()
    .min(20, "Please write at least 20 characters.")
    .max(6000, "Keep your message under 6,000 characters."),
  website: z.string().max(0, "Spam detected.").optional(),
  startedAt: z.string().optional(),
});

export const resumeConfigSchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().max(2500).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid accent color."),
  fontFamily: z.enum(["SANS", "SERIF"]),
  fontScale: z.number().min(0.85).max(1.15),
  showPhoto: z.boolean(),
  showInterests: z.boolean(),
  sectionOrder: z.array(z.string()).min(1),
  hiddenSections: z.array(z.string()),
  template: z.string().min(1).max(60),
});
