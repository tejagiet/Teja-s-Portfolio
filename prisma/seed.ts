import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const PROJECTS = [
  {
    slug: "nexus-giet-smart-campus-platform",
    title: "NEXUS — GIET Polytechnic Smart Campus Platform",
    subtitle: "A connected campus experience",
    category: "Campus platform",
    featured: true,
    sortOrder: 0,
    description:
      "A smart campus platform concept for GIET Polytechnic College, designed to bring campus services, communication and academic workflows into one connected system.",
    content: `## Overview

NEXUS is a concept for a smart campus platform at GIET Polytechnic College. The goal is to give students, faculty and administrators a single place to access campus services and routine academic workflows.

## Scope under consideration

- Campus communication and announcements
- Student-facing service requests
- Academic and administrative workflows
- A shared foundation for future campus modules

## Status

This is a concept record. Implementation details, screenshots and links will be documented in the admin dashboard as the project develops. No deployment or repository link is claimed.`,
  },
  {
    slug: "atfingertip-garudax-pms",
    title: "AtFingerTip PMS / Garudax PMS",
    subtitle: "Property management workflows",
    category: "Business software",
    featured: true,
    sortOrder: 1,
    description:
      "A property management system concept exploring how property, tenant and day-to-day operations data can live in one structured platform.",
    content: `## Overview

AtFingerTip PMS / Garudax PMS is a property management system concept focused on organised property, tenant and operations records.

## Areas being explored

- Property and unit records
- Tenant and occupancy workflows
- Maintenance and service tracking
- Reporting for day-to-day operations

## Status

This entry is a concept record. Detailed scope, technology choices and outcomes will be added when they are ready. No live deployment or repository is claimed.`,
  },
  {
    slug: "giet-face-recognition-system",
    title: "GIET Face Recognition System (FRS)",
    subtitle: "Campus identity and attendance",
    category: "AI & computer vision",
    featured: true,
    sortOrder: 2,
    description:
      "A face-recognition system concept for campus identity and attendance workflows, designed with privacy, consent and responsible use in mind.",
    content: `## Overview

The GIET Face Recognition System is a concept for applying computer vision to campus identity and attendance workflows.

## Principles

- Consent and clear communication before any use of biometric data
- Secure handling of identity data
- Human oversight for attendance exceptions
- A privacy-first approach to storage and retention

## Status

This is a concept record. It does not claim an active deployment or a completed implementation. Technical details will be documented when available.`,
  },
  {
    slug: "openwa-whatsapp-gateway",
    title: "OpenWA WhatsApp Gateway",
    subtitle: "Messaging automation",
    category: "Integration",
    featured: false,
    sortOrder: 3,
    description:
      "A WhatsApp gateway integration concept for automating notifications and conversational workflows through the OpenWA ecosystem.",
    content: `## Overview

OpenWA WhatsApp Gateway explores how applications can send notifications and support conversational workflows through a WhatsApp gateway.

## Potential use cases

- Transactional notifications
- Campus and service updates
- Automated responses for common requests
- Integration with existing backend systems

## Status

This is an integration concept. Provider requirements, implementation notes and any links will be documented when available.`,
  },
  {
    slug: "amc-management-software",
    title: "AMC Management Software",
    subtitle: "Annual maintenance contracts",
    category: "Business software",
    featured: false,
    sortOrder: 4,
    description:
      "An annual maintenance contract management concept covering contracts, scheduled service and service history in one place.",
    content: `## Overview

AMC Management Software is a concept for managing annual maintenance contracts, planned service visits and service records.

## Areas being explored

- Contract and renewal tracking
- Scheduled maintenance
- Service history per customer or asset
- Operational reporting

## Status

This is a concept record. No completion status, client usage or deployment is claimed.`,
  },
  {
    slug: "hotel-lock-integration-middleware",
    title: "Hotel Lock Integration Middleware",
    subtitle: "Software and hardware integration",
    category: "Integration",
    featured: false,
    sortOrder: 5,
    description:
      "A middleware concept for connecting hotel property management workflows with electronic door-lock systems.",
    content: `## Overview

Hotel Lock Integration Middleware explores the bridge between hotel management software and electronic door locks.

## Areas of interest

- Room and guest identity mapping
- Access lifecycle events
- Reliable communication between systems
- Failure handling and auditability

## Status

This is a software and hardware integration concept. Device compatibility and implementation details will be documented when verified.`,
  },
  {
    slug: "ecommerce-and-saas-applications",
    title: "E-commerce and SaaS Applications",
    subtitle: "Product and platform explorations",
    category: "Web applications",
    featured: false,
    sortOrder: 6,
    description:
      "A collection of e-commerce and SaaS application explorations covering storefronts, subscriptions and operational dashboards.",
    content: `## Overview

This record groups explorations into e-commerce and SaaS product patterns.

## Themes

- Storefront and catalogue experiences
- Subscription and account workflows
- Operational dashboards
- Multi-tenant data modelling

## Status

This is an umbrella concept record. Individual applications, links and outcomes will be documented separately when available.`,
  },
  {
    slug: "android-applications",
    title: "Android Applications",
    subtitle: "Mobile utility experiences",
    category: "Android",
    featured: false,
    sortOrder: 7,
    description:
      "Android application explorations focused on practical, everyday utility and campus use cases.",
    content: `## Overview

A record of Android application explorations, with a focus on practical utility and campus use cases.

## Themes

- Native mobile experiences
- Offline-friendly data handling
- Secure authentication
- Integration with web backends

## Status

This is a concept record. Specific applications and store links will be added when they exist.`,
  },
  {
    slug: "network-and-internet-utility-tools",
    title: "Network and Internet Utility Tools",
    subtitle: "Diagnostics and insight",
    category: "Utilities",
    featured: false,
    sortOrder: 8,
    description:
      "Utility tooling concepts for inspecting, diagnosing and understanding networks and internet connectivity.",
    content: `## Overview

Network and Internet Utility Tools is a concept collection for practical networking diagnostics.

## Areas being explored

- Connectivity and latency checks
- Network information and inspection
- Clear, readable diagnostics
- Lightweight tools for everyday troubleshooting

## Status

This is a concept record. Implementation details and links will be documented when available.`,
  },
];

const SKILL_CATEGORIES = [
  {
    name: "Frontend",
    slug: "frontend",
    description: "Interfaces, design systems and modern web experiences.",
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS"],
  },
  {
    name: "Backend",
    slug: "backend",
    description: "APIs, server-side logic and application architecture.",
    skills: ["Node.js", "Next.js Server Actions", "REST APIs", "Auth.js"],
  },
  {
    name: "Databases",
    slug: "databases",
    description: "Relational modelling and data access.",
    skills: ["PostgreSQL", "SQL", "Prisma ORM", "Database design"],
  },
  {
    name: "Cloud & DevOps",
    slug: "cloud-devops",
    description: "Deployment, media infrastructure and delivery.",
    skills: ["Vercel", "Git", "GitHub", "Cloudinary"],
  },
  {
    name: "AI & Data",
    slug: "ai-data",
    description: "Applied artificial intelligence and data fundamentals.",
    skills: ["Python", "Artificial Intelligence", "Computer vision fundamentals"],
  },
  {
    name: "Mobile",
    slug: "mobile",
    description: "Mobile application development.",
    skills: ["Android development"],
  },
  {
    name: "Systems",
    slug: "systems",
    description: "Software and hardware integration.",
    skills: ["System integration", "Networking fundamentals"],
  },
];

const SERVICES = [
  {
    title: "Full-stack web applications",
    icon: "Code2",
    description:
      "Building modern web applications end to end, from the interface to the backend and data layer.",
    features: ["Next.js & React", "TypeScript", "Responsive interfaces", "Accessible design"],
    sortOrder: 0,
  },
  {
    title: "Backend & API engineering",
    icon: "Server",
    description:
      "Designing server-side logic and APIs that are clear, validated and dependable.",
    features: ["Node.js", "Server actions", "REST APIs", "Authentication"],
    sortOrder: 1,
  },
  {
    title: "Database architecture",
    icon: "Database",
    description:
      "Modelling relational data with constraints, indexes and migrations that support growth.",
    features: ["PostgreSQL", "Prisma", "Schema design", "Migrations"],
    sortOrder: 2,
  },
  {
    title: "Cloud & deployment",
    icon: "Cloud",
    description:
      "Shipping applications with production configuration, media storage and secure secrets.",
    features: ["Vercel", "Neon PostgreSQL", "Cloudinary", "Environment configuration"],
    sortOrder: 3,
  },
  {
    title: "AI-powered applications",
    icon: "Brain",
    description:
      "Exploring practical AI features and computer-vision workflows with responsible data handling.",
    features: ["AI integration", "Computer vision", "Data workflows", "Privacy-first design"],
    sortOrder: 4,
  },
  {
    title: "Android applications",
    icon: "Smartphone",
    description:
      "Mobile application development connected to modern backend services.",
    features: ["Android", "API integration", "Offline-friendly patterns", "Authentication"],
    sortOrder: 5,
  },
];

const SEO_PAGES = [
  {
    pageKey: "home",
    path: "/",
    title: "Teja Manikanta — Full-Stack Developer & Software Engineer",
    description:
      "Portfolio of Teja Manikanta, a full-stack developer and AI engineering student building modern web applications, backend systems and database-driven platforms.",
    keywords: [
      "Teja Manikanta",
      "full-stack developer",
      "software engineer",
      "Next.js developer",
      "portfolio",
    ],
  },
  {
    pageKey: "projects",
    path: "/projects",
    title: "Projects — Teja Manikanta",
    description:
      "Software projects by Teja Manikanta across full-stack web applications, backend systems, AI, Android and software-hardware integration.",
    keywords: ["projects", "full-stack projects", "software engineering", "Teja Manikanta"],
  },
  {
    pageKey: "resume",
    path: "/resume",
    title: "Resume — Teja Manikanta",
    description:
      "The latest approved resume for Teja Manikanta, covering education, technical skills, projects and areas of focus.",
    keywords: ["resume", "CV", "Teja Manikanta"],
  },
  {
    pageKey: "contact",
    path: "/contact",
    title: "Contact — Teja Manikanta",
    description:
      "Get in touch with Teja Manikanta about software development, projects and collaboration.",
    keywords: ["contact", "Teja Manikanta"],
  },
];

async function main() {
  console.log("Seeding portfolio database…");

  let admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    admin = await db.user.create({
      data: {
        name: process.env.ADMIN_NAME || "Teja Manikanta",
        email: process.env.ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`✓ Admin account created: ${admin.email}`);
  } else if (admin) {
    console.log(`✓ Admin account already exists: ${admin.email}`);
  } else {
    console.log("! No admin created. Set ADMIN_EMAIL and ADMIN_PASSWORD or use /admin/setup.");
  }

  let profile = await db.profile.findFirst();
  if (!profile) {
    profile = await db.profile.create({
      data: {
        userId: admin!.id,
        displayName: "Teja Manikanta",
        title: "Full-Stack Developer | Software Engineer | Technology Enthusiast",
        tagline: "Building thoughtful software from interface to infrastructure.",
        shortBio:
          "A software developer focused on building modern web applications, backend systems, database-driven platforms, cloud solutions and integrated software systems.",
        about:
          "I'm Teja Manikanta, an engineering student at GIET Polytechnic College pursuing a Diploma in Artificial Intelligence (expected 2027). My work is centred on understanding how complete software systems fit together — the interface people use, the backend that supports it, the data model underneath and the infrastructure that keeps it running.\n\nI'm particularly interested in full-stack application development, backend engineering and API design, database architecture, cloud infrastructure and DevOps, AI-powered applications, Android development and the point where software meets hardware. This portfolio is both a record of what I'm building and a place to document the decisions behind it.\n\nI use this space to share projects honestly: what exists, what is still a concept and what comes next. All content is managed through a custom admin platform, including this introduction.",
        email: "teja.manikanta@example.com",
        phone: null,
        location: null,
        availability: "Open to learning opportunities and collaboration",
        interests: [
          "Full-stack application development",
          "Backend engineering and API development",
          "Database architecture",
          "Cloud infrastructure and DevOps",
          "AI-powered applications",
          "Android application development",
          "Software and hardware integration",
        ],
        resumeSummary:
          "Engineering student pursuing a Diploma in Artificial Intelligence at GIET Polytechnic College (expected 2027), focused on full-stack development, backend engineering, database architecture and cloud solutions. Interested in building complete, well-structured software systems and documenting them responsibly.",
      },
    });

    for (const link of [
      { platform: "GitHub", label: "GitHub", url: "https://github.com/", icon: "Github", sortOrder: 0 },
      { platform: "LinkedIn", label: "LinkedIn", url: "https://www.linkedin.com/", icon: "Linkedin", sortOrder: 1 },
      { platform: "X", label: "X", url: "https://x.com/", icon: "Twitter", sortOrder: 2 },
    ]) {
      await db.socialLink.create({
        data: { ...link, profileId: profile.id, isVisible: false },
      });
    }
    console.log("✓ Profile and placeholder social links created");
  } else {
    console.log("✓ Profile already exists (left unchanged)");
  }

  const categoryIds = new Map<string, string>();
  for (const [index, category] of SKILL_CATEGORIES.entries()) {
    const record = await db.skillCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: index,
      },
    });
    categoryIds.set(category.slug, record.id);
    for (const [skillIndex, skill] of category.skills.entries()) {
      await db.skill.upsert({
        where: { categoryId_name: { categoryId: record.id, name: skill } },
        update: {},
        create: {
          categoryId: record.id,
          name: skill,
          sortOrder: skillIndex,
          isVisible: true,
        },
      });
    }
  }
  console.log("✓ Skill categories and skills");

  for (const project of PROJECTS) {
    await db.project.upsert({
      where: { slug: project.slug },
      update: {},
      create: {
        ...project,
        status: "CONCEPT",
        published: true,
        techStack: [],
      },
    });
  }
  console.log("✓ Project records (concept status, no fabricated links)");

  const education = await db.education.findFirst({
    where: { institution: "GIET Polytechnic College", degree: "Diploma in Artificial Intelligence" },
  });
  if (!education) {
    await db.education.create({
      data: {
        institution: "GIET Polytechnic College",
        degree: "Diploma in Artificial Intelligence",
        field: "Artificial Intelligence",
        startYear: null,
        endYear: 2027,
        isCurrent: true,
        description:
          "Currently pursuing a Diploma in Artificial Intelligence. Expected completion in 2027.",
        sortOrder: 0,
        published: true,
      },
    });
  }
  console.log("✓ Education record");

  for (const service of SERVICES) {
    const existing = await db.service.findFirst({ where: { title: service.title } });
    if (!existing) {
      await db.service.create({
        data: { ...service, priceNote: null, published: true },
      });
    }
  }
  console.log("✓ Services");

  for (const page of SEO_PAGES) {
    await db.seoMetadata.upsert({
      where: { pageKey: page.pageKey },
      update: {},
      create: {
        pageKey: page.pageKey,
        path: page.path,
        title: page.title,
        description: page.description,
        keywords: page.keywords,
        noIndex: false,
      },
    });
  }
  console.log("✓ SEO metadata");

  await db.siteSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteName: "Teja Manikanta",
      siteDescription:
        "Portfolio of Teja Manikanta, a full-stack developer and engineering student focused on web applications, backend systems, databases and cloud solutions.",
      siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
      footerNote: "Designed and built as a fully dynamic portfolio platform.",
      contactEmail: "teja.manikanta@example.com",
      availabilityNote: "Open to learning opportunities and collaboration",
      resumePublicEnabled: true,
      maintenanceMode: false,
    },
  });
  console.log("✓ Website settings");

  const templates = [
    {
      name: "Modern",
      slug: "modern",
      description: "Accent header, clean single column and confident typography.",
      layout: "modern",
      accentColor: "#4f46e5",
      fontFamily: "SANS",
      isDefault: true,
    },
    {
      name: "Classic",
      slug: "classic",
      description: "Traditional serif typography for a formal application.",
      layout: "classic",
      accentColor: "#1f2937",
      fontFamily: "SERIF",
      isDefault: false,
    },
    {
      name: "Minimal",
      slug: "minimal",
      description: "Quiet, spacious design that lets the content lead.",
      layout: "minimal",
      accentColor: "#0f766e",
      fontFamily: "SANS",
      isDefault: false,
    },
    {
      name: "Compact",
      slug: "compact",
      description: "A denser layout for a longer record of experience.",
      layout: "compact",
      accentColor: "#9a3412",
      fontFamily: "SANS",
      isDefault: false,
    },
  ];

  for (const template of templates) {
    await db.resumeTemplate.upsert({
      where: { slug: template.slug },
      update: {},
      create: template,
    });
  }
  console.log("✓ Resume templates");

  const existingResume = await db.resumeVersion.findFirst();
  if (!existingResume && profile) {
    const template = await db.resumeTemplate.findUnique({ where: { slug: "modern" } });
    const [experience, educationEntries, categories, projects, certifications, achievements, links] =
      await Promise.all([
        db.experience.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
        db.education.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
        db.skillCategory.findMany({
          orderBy: { sortOrder: "asc" },
          include: { skills: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
        }),
        db.project.findMany({
          where: { published: true },
          orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        }),
        db.certification.findMany({ where: { published: true } }),
        db.achievement.findMany({ where: { published: true } }),
        db.socialLink.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } }),
      ]);

    const summary =
      profile.resumeSummary || profile.shortBio || profile.about;

    const content = {
      profile: {
        name: profile.displayName,
        title: profile.title,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        summary,
        photoUrl: profile.profilePhotoUrl,
        interests: profile.interests,
        links: links.map((link) => ({
          label: link.label,
          url: link.url,
          platform: link.platform,
        })),
      },
      sections: [
        { key: "summary", title: "Professional Summary", items: [{ id: "summary", text: summary }] },
        {
          key: "experience",
          title: "Experience",
          items: experience.map((item) => ({
            id: item.id,
            role: item.role,
            organization: item.organization,
            type: item.type,
            location: item.location,
            startDate: item.startDate.toISOString(),
            endDate: item.endDate?.toISOString() ?? null,
            isCurrent: item.isCurrent,
            description: item.description,
            highlights: item.highlights,
          })),
        },
        {
          key: "education",
          title: "Education",
          items: educationEntries.map((item) => ({
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
          title: "Technical Skills",
          items: categories
            .filter((category) => category.skills.length)
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
          title: "Selected Projects",
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
        { key: "certifications", title: "Certifications", items: certifications.map((item) => ({
          id: item.id,
          title: item.title,
          issuer: item.issuer,
          issueDate: item.issueDate?.toISOString() ?? null,
          credentialId: item.credentialId,
          credentialUrl: item.credentialUrl,
        })) },
        { key: "achievements", title: "Achievements", items: achievements.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          date: item.date?.toISOString() ?? null,
        })) },
      ],
      generatedAt: new Date().toISOString(),
    };

    const config = {
      template: template?.layout || "modern",
      accentColor: template?.accentColor || "#4f46e5",
      fontFamily: template?.fontFamily || "SANS",
      fontScale: 1,
      showPhoto: true,
      showInterests: true,
      sectionOrder: [
        "summary",
        "experience",
        "education",
        "skills",
        "projects",
        "certifications",
        "achievements",
      ],
      hiddenSections: ["certifications", "achievements"],
    };

    const version = await db.resumeVersion.create({
      data: {
        templateId: template!.id,
        createdById: admin?.id,
        version: 1,
        title: "Initial approved resume",
        status: "PUBLISHED",
        summary,
        config,
        content,
        autoGenerated: false,
        outdated: false,
        publishedAt: new Date(),
      },
    });

    await db.resumeSection.createMany({
      data: content.sections.map((section, index) => ({
        versionId: version.id,
        key: section.key,
        title: section.title,
        sortOrder: index,
        isVisible: !config.hiddenSections.includes(section.key),
        content: section.items,
      })),
    });

    console.log("✓ Initial approved resume (v1)");
  }

  if (admin) {
    const logCount = await db.activityLog.count();
    if (logCount === 0) {
      await db.activityLog.create({
        data: {
          userId: admin.id,
          action: "SETUP",
          entityType: "workspace",
          description: "Portfolio workspace initialized",
          metadata: { seeded: true },
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
