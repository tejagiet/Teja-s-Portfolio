import type { Metadata } from "next";
import Link from "next/link";

import { AboutSection } from "@/components/public/about-section";
import { AchievementsSection } from "@/components/public/achievements-section";
import { CertificationsSection } from "@/components/public/certifications-section";
import { ContactSection } from "@/components/public/contact-section";
import { EducationSection } from "@/components/public/education-section";
import { ExperienceSection } from "@/components/public/experience-section";
import { Hero } from "@/components/public/hero";
import { JsonLd } from "@/components/public/json-ld";
import { ProjectsSection } from "@/components/public/projects-section";
import { ResumeSection } from "@/components/public/resume-section";
import { ServicesSection } from "@/components/public/services-section";
import { SkillsSection } from "@/components/public/skills-section";
import { buttonVariants } from "@/components/ui/button";
import { getPublicPortfolio } from "@/lib/public-data";
import { buildPageMetadata, personJsonLd, profilePageJsonLd, websiteJsonLd } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    pageKey: "home",
    path: "/",
    fallbackTitle: "Teja Manikanta — Full-Stack Developer & Software Engineer",
    fallbackDescription:
      "Portfolio of Teja Manikanta, a full-stack developer and engineering student building modern web applications, backend systems, database-driven platforms and cloud solutions.",
    type: "profile",
    keywords: ["Teja Manikanta", "full-stack developer", "software engineer", "portfolio"],
  });
}

export default async function HomePage() {
  const data = await getPublicPortfolio();
  const { profile } = data;

  if (!profile) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Portfolio</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">The profile is being set up.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Content is managed through the admin dashboard. Once the profile is complete, this page will
          build itself from the database.
        </p>
        <Link href="/admin/login" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
          Open admin
        </Link>
      </div>
    );
  }

  const resumeAvailable = Boolean(data.resume && data.settings.resumePublicEnabled);
  const sameAs = profile.socialLinks.map((link) => link.url);

  return (
    <>
      <JsonLd
        data={[
          personJsonLd({
            name: profile.displayName,
            title: profile.title,
            description: profile.shortBio || profile.about,
            url: data.settings.siteUrl,
            image: profile.profilePhotoUrl,
            email: profile.email,
            sameAs,
            location: profile.location,
          }),
          profilePageJsonLd(profile.displayName, data.settings.siteUrl),
          websiteJsonLd(data.settings.siteName, data.settings.siteUrl, data.settings.siteDescription),
        ]}
      />

      <Hero
        profile={profile}
        education={data.education}
        socialLinks={profile.socialLinks}
        resumeAvailable={resumeAvailable}
      />
      <AboutSection profile={profile} education={data.education} />
      <SkillsSection categories={data.skillCategories} />
      <ProjectsSection projects={data.projects} />
      <ExperienceSection experiences={data.experiences} />
      <EducationSection education={data.education} />
      <CertificationsSection certifications={data.certifications} />
      <ServicesSection services={data.services} />
      <AchievementsSection achievements={data.achievements} />
      <ResumeSection available={resumeAvailable} publishedAt={data.resume?.publishedAt} />
      <ContactSection
        profile={profile}
        fallbackEmail={data.settings.contactEmail}
        availability={data.settings.availabilityNote}
      />
    </>
  );
}
