import "server-only";

import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

export async function getPublicPortfolio() {
  const [
    profile,
    skillCategories,
    projects,
    experiences,
    education,
    certifications,
    services,
    achievements,
    resume,
    settings,
  ] = await Promise.all([
    db.profile.findFirst({
      include: {
        socialLinks: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
        },
      },
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
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    db.experience.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
    }),
    db.education.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { startYear: "desc" }],
    }),
    db.certification.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { issueDate: "desc" }],
    }),
    db.service.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    db.achievement.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { date: "desc" }],
    }),
    db.resumeVersion.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { id: true, publishedAt: true, outdated: true, title: true },
    }),
    getSiteSettings(),
  ]);

  return {
    profile,
    skillCategories: skillCategories.filter((category) => category.skills.length > 0),
    projects,
    featuredProjects: projects.filter((project) => project.featured),
    experiences,
    education,
    certifications,
    services,
    achievements,
    resume,
    settings,
  };
}

export type PublicPortfolio = Awaited<ReturnType<typeof getPublicPortfolio>>;
export type PublicProject = PublicPortfolio["projects"][number];
