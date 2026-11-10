import { Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/public/contact-form";
import { Reveal } from "@/components/public/reveal";
import { Icon } from "@/components/ui/icon";
import type { PublicPortfolio } from "@/lib/public-data";

export function ContactSection({
  profile,
  fallbackEmail,
  availability,
}: {
  profile: NonNullable<PublicPortfolio["profile"]>;
  fallbackEmail: string | null;
  availability: string | null;
}) {
  const email = profile.email || fallbackEmail;

  return (
    <section id="contact" className="scroll-mt-24 border-t border-border py-20 sm:py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
        <Reveal>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            <span className="h-1 w-1 rounded-full bg-accent" />
            Contact
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Have something in mind?
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Whether it&apos;s a question, a project idea, a collaboration or a learning opportunity,
            send a message and I&apos;ll respond as soon as I can.
          </p>

          <div className="mt-8 space-y-3">
            {email ? (
              <a
                href={`mailto:${email}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-accent/30"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>
                  <span className="block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Email</span>
                  <span className="text-xs font-medium">{email}</span>
                </span>
              </a>
            ) : null}
            {profile.phone ? (
              <a
                href={`tel:${profile.phone}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-accent/30"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>
                  <span className="block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Phone</span>
                  <span className="text-xs font-medium">{profile.phone}</span>
                </span>
              </a>
            ) : null}
            {profile.location ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>
                  <span className="block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Location</span>
                  <span className="text-xs font-medium">{profile.location}</span>
                </span>
              </div>
            ) : null}
          </div>

          {profile.socialLinks.length ? (
            <div className="mt-6">
              <p className="mb-2 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Find me online</p>
              <div className="flex flex-wrap gap-2">
                {profile.socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground"
                  >
                    <Icon name={link.icon || link.platform} className="h-3 w-3" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-6 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {profile.availability || availability || "Open to collaboration"}
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
