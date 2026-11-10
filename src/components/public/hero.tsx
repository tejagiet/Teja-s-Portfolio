import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, MapPin, Sparkles } from "lucide-react";

import { HeroCanvas } from "@/components/public/hero-canvas";
import { Reveal } from "@/components/public/reveal";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { PublicPortfolio } from "@/lib/public-data";
import { cn, initials } from "@/lib/utils";

function Title({ title }: { title: string }) {
  const parts = title.split("|").map((part) => part.trim()).filter(Boolean);
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-muted-foreground sm:text-[15px]">
      {parts.map((part, index) => (
        <span key={part} className="inline-flex items-center gap-2.5">
          {index > 0 ? <span className="h-1 w-1 rounded-full bg-accent/70" aria-hidden /> : null}
          {part}
        </span>
      ))}
    </p>
  );
}

export function Hero({
  profile,
  education,
  socialLinks,
  resumeAvailable,
}: {
  profile: NonNullable<PublicPortfolio["profile"]>;
  education: PublicPortfolio["education"];
  socialLinks: PublicPortfolio["profile"] extends null ? never : NonNullable<PublicPortfolio["profile"]>["socialLinks"];
  resumeAvailable: boolean;
}) {
  const primaryEducation = education[0];

  return (
    <section className="ambient relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pb-28">
      <HeroCanvas />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.06fr_0.94fr] lg:gap-10">
        <div>
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {profile.availability || "Open to learning opportunities and collaboration"}
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="mt-7 text-balance text-[clamp(2.85rem,7vw,5.1rem)] font-semibold leading-[0.95] tracking-[-0.055em]">
              Teja
              <span className="text-gradient"> Manikanta</span>
              <span className="text-accent">.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.12} className="mt-6">
            <Title title={profile.title} />
            <p className="mt-5 max-w-[34rem] text-sm leading-[1.8] text-muted-foreground sm:text-[15px]">
              {profile.shortBio ||
                "A software developer focused on building modern web applications, backend systems, database-driven platforms, cloud solutions and integrated software systems."}
            </p>
          </Reveal>

          <Reveal delay={0.18} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={resumeAvailable ? "/api/resume/download" : "/resume"}
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                className: "group rounded-full px-6 shadow-lg shadow-accent/20",
              })}
              prefetch={false}
            >
              <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
              Download resume
            </Link>
            <Link
              href="/projects"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "group rounded-full px-6",
              })}
            >
              View projects
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </Reveal>

          <Reveal delay={0.24} className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={link.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:text-foreground"
                >
                  <Icon name={link.icon || link.platform} className="h-3.5 w-3.5" />
                </a>
              ))}
              {profile.email ? (
                <a
                  href={`mailto:${profile.email}`}
                  aria-label="Email Teja Manikanta"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:text-foreground"
                >
                  <Icon name="Mail" className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
            <span className="hidden h-4 w-px bg-border sm:block" />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
              {primaryEducation ? (
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-accent" aria-hidden />
                  {primaryEducation.degree}
                  {primaryEducation.endYear ? ` · ${primaryEducation.isCurrent ? "Expected " : ""}${primaryEducation.endYear}` : ""}
                </span>
              ) : null}
              {profile.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-accent" aria-hidden />
                  {profile.location}
                </span>
              ) : null}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="relative mx-auto w-full max-w-[26rem] lg:ml-auto">
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-accent/20 via-accent/5 to-transparent blur-2xl" />
            <div className="absolute -left-3 -top-3 h-24 w-24 rounded-2xl border border-accent/20 bg-accent/5" aria-hidden />
            <div className="absolute -bottom-4 -right-3 h-32 w-32 rounded-2xl border border-border bg-card/40 backdrop-blur" aria-hidden />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-2 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-muted">
                {profile.profilePhotoUrl ? (
                  <Image
                    src={profile.profilePhotoUrl}
                    alt={`${profile.displayName} portrait`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 1200px"
                    quality={95}
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted via-card to-accent-soft">
                    <div className="absolute inset-0 grid-pattern opacity-60" />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-accent/20 bg-card/70 text-3xl font-semibold tracking-tight text-foreground shadow-xl backdrop-blur">
                      {initials(profile.displayName)}
                    </div>
                    <p className="relative mt-5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Full-stack · AI · Cloud
                    </p>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />
              </div>
            </div>

            <div className="glass animate-float-slow absolute -left-7 top-10 hidden rounded-xl border border-border px-3 py-2 shadow-lg sm:block">
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Focus</p>
              <p className="mt-0.5 text-[11px] font-medium">Full-stack engineering</p>
            </div>
            <div className="glass absolute -right-5 top-[42%] hidden rounded-xl border border-border px-3 py-2 shadow-lg sm:block">
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Studying</p>
              <p className="mt-0.5 text-[11px] font-medium">Diploma in AI</p>
            </div>
            <div className="glass animate-float-slow absolute -bottom-5 left-6 rounded-xl border border-border px-3 py-2 shadow-lg [animation-delay:1.4s]">
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Interests</p>
              <p className="mt-0.5 text-[11px] font-medium">Web · Cloud · AI · Android</p>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mx-auto mt-16 w-full max-w-6xl px-5 sm:px-8">
        <div className={cn("flex flex-col gap-4 border-t border-border pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between")}>
          <p className="max-w-xl leading-relaxed">
            Currently focused on full-stack systems, cloud infrastructure and AI-powered applications.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/#about" className="transition-colors hover:text-foreground">
              Scroll to explore
            </Link>
            <span className="h-3 w-px bg-border" />
            <Link href="/admin/login" className="transition-colors hover:text-foreground">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
