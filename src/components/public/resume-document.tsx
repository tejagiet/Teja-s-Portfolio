import Image from "next/image";
import type { CSSProperties } from "react";

import {
  normalizeResumeConfig,
  parseResumeContent,
  type ResumeConfig,
} from "@/lib/resume-types";
import { formatDate } from "@/lib/utils";

type SectionItem = Record<string, unknown>;

function SectionHeading({
  children,
  accent,
  template,
}: {
  children: React.ReactNode;
  accent: string;
  template: string;
}) {
  if (template === "classic") {
    return (
      <div className="mb-2.5 border-b border-neutral-300 pb-1 text-center">
        <h2
          className="font-serif text-[0.74em] font-bold uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          {children}
        </h2>
      </div>
    );
  }

  if (template === "minimal") {
    return (
      <div className="mb-2 flex items-center justify-between border-b border-neutral-200/80 pb-1">
        <h2 className="text-[0.68em] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          {children}
        </h2>
      </div>
    );
  }

  if (template === "compact") {
    return (
      <div className="mb-1.5 flex items-center gap-2 border-b border-neutral-200 pb-0.5">
        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: accent }} />
        <h2
          className="text-[0.66em] font-bold uppercase tracking-[0.12em]"
          style={{ color: accent }}
        >
          {children}
        </h2>
      </div>
    );
  }

  // Default: modern
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span className="h-[3px] w-4 rounded-full" style={{ backgroundColor: accent }} />
      <h2
        className="text-[0.7em] font-semibold uppercase tracking-[0.14em]"
        style={{ color: accent }}
      >
        {children}
      </h2>
      <span className="h-px flex-1 bg-neutral-200" />
    </div>
  );
}

export function ResumeDocument({
  content: rawContent,
  config: rawConfig,
}: {
  content: unknown;
  config: unknown;
}) {
  const content = parseResumeContent(rawContent);
  const config: ResumeConfig = normalizeResumeConfig(rawConfig);
  if (!content) {
    return (
      <div className="resume-paper flex items-center justify-center">
        <p className="text-sm text-neutral-500">Resume content is unavailable.</p>
      </div>
    );
  }

  const accent = config.accentColor;
  const template = config.template || "modern";
  const hiddenItemsSet = new Set(config.hiddenItems ?? []);

  const orderedSections = config.sectionOrder
    .map((key) => content.sections.find((section) => section.key === key))
    .filter((section) => section && !config.hiddenSections.includes(section.key));

  const contactParts = [
    content.profile.email,
    content.profile.phone,
    content.profile.location,
    ...content.profile.links.slice(0, 2).map((link) => link.url.replace(/^https?:\/\//, "")),
  ].filter(Boolean) as string[];

  const fontClass =
    config.fontFamily === "SERIF" || template === "classic"
      ? "font-serif"
      : "font-sans";

  return (
    <article
      className={`resume-paper ${fontClass} ${
        template === "compact" ? "leading-tight text-[13px]" : "text-[14px]"
      }`}
      style={
        {
          "--resume-accent": accent,
          fontSize: `${config.fontScale * (template === "compact" ? 13 : 14)}px`,
        } as CSSProperties
      }
    >
      {/* ===================== HEADER ===================== */}
      {template === "classic" ? (
        <header className="border-b-2 border-neutral-900 pb-4 text-center">
          {config.showPhoto && content.profile.photoUrl ? (
            <div
              className="relative mx-auto mb-3 h-[72px] w-[72px] overflow-hidden rounded-full border-2"
              style={{ borderColor: accent }}
            >
              <Image
                src={content.profile.photoUrl}
                alt={content.profile.name}
                fill
                sizes="72px"
                className="object-cover"
              />
            </div>
          ) : null}
          <h1 className="text-[2em] font-bold tracking-tight text-neutral-950">
            {content.profile.name}
          </h1>
          <p
            className="mt-1 text-[0.95em] font-medium uppercase tracking-[0.14em]"
            style={{ color: accent }}
          >
            {content.profile.title}
          </p>
          {contactParts.length ? (
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.72em] text-neutral-600">
              {contactParts.map((part, index) => (
                <span key={`${part}-${index}`} className="inline-flex items-center gap-1.5">
                  {index > 0 ? <span>•</span> : null}
                  {part}
                </span>
              ))}
            </div>
          ) : null}
        </header>
      ) : template === "minimal" ? (
        <header className="border-b border-neutral-200 pb-4">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-[1.95em] font-light tracking-tight text-neutral-900">
                {content.profile.name}
              </h1>
              <p className="mt-1 text-[0.9em] font-normal text-neutral-500">
                {content.profile.title}
              </p>
              {contactParts.length ? (
                <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[0.72em] text-neutral-500">
                  {contactParts.map((part, index) => (
                    <span key={`${part}-${index}`} className="inline-flex items-center gap-1.5">
                      {index > 0 ? <span className="opacity-40">/</span> : null}
                      {part}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            {config.showPhoto && content.profile.photoUrl ? (
              <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg grayscale">
                <Image
                  src={content.profile.photoUrl}
                  alt={content.profile.name}
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
        </header>
      ) : template === "compact" ? (
        <header
          className="flex items-center justify-between gap-4 border-b pb-3"
          style={{ borderColor: accent }}
        >
          <div className="min-w-0">
            <h1 className="text-[1.75em] font-bold leading-none tracking-tight text-neutral-900">
              {content.profile.name}
            </h1>
            <p className="mt-1 text-[0.88em] font-semibold" style={{ color: accent }}>
              {content.profile.title}
            </p>
          </div>
          <div className="text-right text-[0.68em] leading-snug text-neutral-600">
            {content.profile.email ? <div>{content.profile.email}</div> : null}
            {content.profile.phone ? <div>{content.profile.phone}</div> : null}
            {content.profile.location ? <div>{content.profile.location}</div> : null}
            {content.profile.links.slice(0, 1).map((l) => (
              <div key={l.url}>{l.url.replace(/^https?:\/\//, "")}</div>
            ))}
          </div>
        </header>
      ) : (
        /* Modern (default) */
        <header
          className="flex items-start justify-between gap-6 border-b-2 pb-4"
          style={{ borderColor: accent }}
        >
          <div className="min-w-0">
            <h1 className="text-[2.15em] font-semibold leading-[1.05] tracking-[-0.03em] text-neutral-900">
              {content.profile.name}
            </h1>
            <p className="mt-1.5 text-[0.98em] font-medium" style={{ color: accent }}>
              {content.profile.title}
            </p>
            {contactParts.length ? (
              <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1 text-[0.74em] text-neutral-600">
                {contactParts.map((part, index) => (
                  <span key={`${part}-${index}`} className="inline-flex items-center gap-1.5">
                    {index > 0 ? <span className="h-0.5 w-0.5 rounded-full bg-neutral-400" /> : null}
                    {part}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {config.showPhoto && content.profile.photoUrl ? (
            <div
              className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-xl border-2 shadow-sm"
              style={{ borderColor: accent }}
            >
              <Image
                src={content.profile.photoUrl}
                alt={content.profile.name}
                fill
                sizes="82px"
                className="object-cover"
              />
            </div>
          ) : null}
        </header>
      )}

      {/* ===================== SECTIONS ===================== */}
      <div className={`mt-4 ${template === "compact" ? "space-y-3.5" : "space-y-4.5"}`}>
        {orderedSections.map((section) => {
          if (!section) return null;
          const rawItems = section.items as SectionItem[];
          const items = rawItems.filter((item) => !hiddenItemsSet.has(String(item.id)));

          if (section.key === "summary") {
            if (!content.profile.summary.trim()) return null;
            return (
              <section key={section.key}>
                <SectionHeading accent={accent} template={template}>
                  {section.title}
                </SectionHeading>
                <p className="text-[0.84em] leading-[1.65] text-neutral-700">
                  {content.profile.summary}
                </p>
              </section>
            );
          }

          if (!items.length) return null;

          if (section.key === "experience") {
            return (
              <section key={section.key}>
                <SectionHeading accent={accent} template={template}>
                  {section.title}
                </SectionHeading>
                <div className={template === "compact" ? "space-y-2.5" : "space-y-3.5"}>
                  {items.map((item) => {
                    const start = item.startDate ? formatDate(String(item.startDate)) : "";
                    const end = item.isCurrent
                      ? "Present"
                      : item.endDate
                        ? formatDate(String(item.endDate))
                        : "";
                    return (
                      <div key={String(item.id)}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                          <p className="text-[0.9em] font-semibold text-neutral-900">
                            {String(item.role || "")}
                          </p>
                          <p className="text-[0.72em] text-neutral-500">
                            {[start, end].filter(Boolean).join(" — ")}
                          </p>
                        </div>
                        <p className="text-[0.8em] font-medium" style={{ color: accent }}>
                          {[item.organization, item.location].filter(Boolean).join(" · ")}
                        </p>
                        {item.description ? (
                          <p className="mt-1 text-[0.8em] leading-[1.55] text-neutral-600">
                            {String(item.description)}
                          </p>
                        ) : null}
                        {Array.isArray(item.highlights) && item.highlights.length ? (
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[0.78em] leading-[1.5] text-neutral-600">
                            {(item.highlights as string[]).map((highlight) => (
                              <li key={highlight}>{highlight}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          }

          if (section.key === "education") {
            return (
              <section key={section.key}>
                <SectionHeading accent={accent} template={template}>
                  {section.title}
                </SectionHeading>
                <div className={template === "compact" ? "space-y-2" : "space-y-3"}>
                  {items.map((item) => (
                    <div key={String(item.id)}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <p className="text-[0.88em] font-semibold text-neutral-900">
                          {[item.degree, item.field].filter(Boolean).join(", ")}
                        </p>
                        <p className="text-[0.72em] text-neutral-500">
                          {[item.startYear, item.isCurrent ? "Present" : item.endYear]
                            .filter(Boolean)
                            .join(" — ")}
                        </p>
                      </div>
                      <p className="text-[0.8em] font-medium" style={{ color: accent }}>
                        {String(item.institution || "")}
                        {item.grade ? ` · ${String(item.grade)}` : ""}
                      </p>
                      {item.description ? (
                        <p className="mt-0.5 text-[0.78em] leading-[1.5] text-neutral-600">
                          {String(item.description)}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (section.key === "skills") {
            return (
              <section key={section.key}>
                <SectionHeading accent={accent} template={template}>
                  {section.title}
                </SectionHeading>
                <div
                  className={
                    template === "compact"
                      ? "grid grid-cols-2 gap-2 text-[0.78em]"
                      : "space-y-1.5"
                  }
                >
                  {items.map((group) => {
                    const skills = Array.isArray(group.skills)
                      ? (group.skills as Array<{ name: string }>).map((skill) => skill.name)
                      : [];
                    return (
                      <p key={String(group.id)} className="text-[0.8em] leading-[1.55]">
                        <span className="font-semibold text-neutral-900">
                          {String(group.name || "Skills")}:{" "}
                        </span>
                        <span className="text-neutral-600">{skills.join(", ")}</span>
                      </p>
                    );
                  })}
                </div>
              </section>
            );
          }

          if (section.key === "projects") {
            return (
              <section key={section.key}>
                <SectionHeading accent={accent} template={template}>
                  {section.title}
                </SectionHeading>
                <div className={template === "compact" ? "space-y-2" : "space-y-2.5"}>
                  {items.map((item) => (
                    <div key={String(item.id)}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <p className="text-[0.84em] font-semibold text-neutral-900">
                          {String(item.title || "")}
                        </p>
                        <p className="text-[0.7em] uppercase tracking-wide text-neutral-500">
                          {String(item.category || "")}
                        </p>
                      </div>
                      <p className="text-[0.78em] leading-[1.5] text-neutral-600">
                        {String(item.description || "")}
                      </p>
                      {Array.isArray(item.techStack) && item.techStack.length ? (
                        <p className="mt-0.5 text-[0.72em]" style={{ color: accent }}>
                          {(item.techStack as string[]).join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (section.key === "certifications") {
            return (
              <section key={section.key}>
                <SectionHeading accent={accent} template={template}>
                  {section.title}
                </SectionHeading>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={String(item.id)}
                      className="flex flex-wrap items-baseline justify-between gap-x-4"
                    >
                      <p className="text-[0.8em] text-neutral-800">
                        <span className="font-semibold">{String(item.title || "")}</span>
                        <span className="text-neutral-500"> — {String(item.issuer || "")}</span>
                      </p>
                      <p className="text-[0.72em] text-neutral-500">
                        {item.issueDate ? formatDate(String(item.issueDate)) : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (section.key === "achievements") {
            return (
              <section key={section.key}>
                <SectionHeading accent={accent} template={template}>
                  {section.title}
                </SectionHeading>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={String(item.id)}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <p className="text-[0.82em] font-semibold text-neutral-900">
                          {String(item.title || "")}
                        </p>
                        <p className="text-[0.7em] text-neutral-500">
                          {item.date ? formatDate(String(item.date)) : ""}
                        </p>
                      </div>
                      {item.description ? (
                        <p className="text-[0.78em] leading-[1.5] text-neutral-600">
                          {String(item.description)}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}

        {config.showInterests && content.profile.interests.length ? (
          <section>
            <SectionHeading accent={accent} template={template}>
              Areas of Interest
            </SectionHeading>
            <p className="text-[0.8em] leading-[1.55] text-neutral-600">
              {content.profile.interests.join(" · ")}
            </p>
          </section>
        ) : null}
      </div>

      <footer className="mt-8 border-t border-neutral-200 pt-2 text-[0.65em] text-neutral-400">
        Generated from the portfolio of {content.profile.name} ·{" "}
        {formatDate(content.generatedAt, { day: "numeric", month: "short", year: "numeric" })}
      </footer>
    </article>
  );
}
