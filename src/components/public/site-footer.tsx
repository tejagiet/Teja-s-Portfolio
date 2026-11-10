import Link from "next/link";

import { Icon } from "@/components/ui/icon";

type FooterLink = { label: string; url: string; platform: string; icon?: string | null };

export function SiteFooter({
  name,
  title,
  socialLinks,
  contactEmail,
  footerNote,
  siteName,
}: {
  name: string;
  title: string;
  socialLinks: FooterLink[];
  contactEmail: string | null;
  footerNote: string | null;
  siteName: string;
}) {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-foreground text-[11px] font-bold text-background">
                TM
                <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent" />
              </span>
              <span className="text-sm font-semibold tracking-tight">{name}</span>
            </Link>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {footerNote ||
                "A dynamic portfolio and management platform for documenting work with clarity and honesty."}
            </p>
            <p className="mt-4 text-[11px] text-muted-foreground">{title}</p>
          </div>

          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
              {[
                { href: "/#about", label: "About" },
                { href: "/projects", label: "Projects" },
                { href: "/resume", label: "Resume" },
                { href: "/#contact", label: "Contact" },
                { href: "/admin/login", label: "Admin" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Connect
            </h2>
            <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
              {contactEmail ? (
                <li>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
                  >
                    <Icon name="Mail" className="h-3.5 w-3.5" />
                    {contactEmail}
                  </a>
                </li>
              ) : null}
              {socialLinks.length ? (
                socialLinks.map((link) => (
                  <li key={link.url + link.platform}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
                    >
                      <Icon name={link.icon || link.platform} className="h-3.5 w-3.5" />
                      {link.label}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground/70">Social profiles are being configured.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5">
            Built with Next.js, Neon PostgreSQL and a custom CMS.
          </p>
        </div>
      </div>
    </footer>
  );
}
