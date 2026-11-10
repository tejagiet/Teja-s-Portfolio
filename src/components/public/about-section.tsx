import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, GraduationCap, Compass, MapPin, CircleDot } from "lucide-react";

import { Reveal } from "@/components/public/reveal";
import { Icon } from "@/components/ui/icon";
import type { PublicPortfolio } from "@/lib/public-data";
import { initials } from "@/lib/utils";

export function AboutSection({
  profile,
  education,
}: {
  profile: NonNullable<PublicPortfolio["profile"]>;
  education: PublicPortfolio["education"];
}) {
  const paragraphs = profile.about.split(/\n{2,}/).filter(Boolean);
  const primaryEducation = education[0];

  return (
    <section id="about" className="scroll-mt-24 border-t border-border py-20 sm:py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-card">
            {profile.aboutPhotoUrl || profile.profilePhotoUrl ? (
              <Image
                src={profile.aboutPhotoUrl || profile.profilePhotoUrl || ""}
                alt={`${profile.displayName} — about`}
                fill
                sizes="(max-width: 1024px) 100vw, 380px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-accent-soft/80 via-card to-muted">
                <div className="absolute inset-0 grid-pattern opacity-40" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-accent/20 bg-card/70 text-2xl font-semibold tracking-tight shadow-xl backdrop-blur">
                  {initials(profile.displayName)}
                </div>
                <p className="relative mt-5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Full-stack · AI · Cloud
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <GraduationCap className="h-4 w-4 text-accent" aria-hidden />
              <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Education</p>
              <p className="mt-1 text-xs font-medium">{primaryEducation?.institution || "GIET Polytechnic College"}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <Compass className="h-4 w-4 text-accent" aria-hidden />
              <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Focus</p>
              <p className="mt-1 text-xs font-medium">Full-stack systems &amp; AI</p>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              <span className="h-1 w-1 rounded-full bg-accent" />
              About
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
              Curious about how complete systems fit together.
            </h2>
            {profile.tagline ? (
              <p className="mt-4 text-sm font-medium text-foreground/80">{profile.tagline}</p>
            ) : null}
          </Reveal>

          <Reveal delay={0.08} className="mt-6 space-y-4">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-sm leading-[1.85] text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </Reveal>

          {profile.interests.length ? (
            <Reveal delay={0.14} className="mt-8">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Areas of interest
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground"
                  >
                    <CircleDot className="h-2.5 w-2.5 text-accent/70" aria-hidden />
                    {interest}
                  </span>
                ))}
              </div>
            </Reveal>
          ) : null}

          <Reveal delay={0.2} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-6 text-xs text-muted-foreground">
            {profile.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden />
                {profile.location}
              </span>
            ) : null}
            {profile.socialLinks.length ? (
              <Link href="/#contact" className="group inline-flex items-center gap-1.5 font-medium text-foreground">
                Let&apos;s connect
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ) : null}
            <Link href="/resume" className="ml-auto inline-flex items-center gap-1.5 text-accent">
              <Icon name="FileText" className="h-3.5 w-3.5" />
              View resume
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
