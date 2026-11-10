"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Eye,
  EyeOff,
  Palette,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { ResumeDocument } from "@/components/public/resume-document";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { saveResumeConfigAction } from "@/lib/actions/resume";
import { RESUME_SECTION_DEFINITIONS, RESUME_TEMPLATE_LAYOUTS } from "@/lib/constants";
import {
  normalizeResumeConfig,
  parseResumeContent,
  type ResumeConfig,
} from "@/lib/resume-types";

function normalizeOrder(input: string[]) {
  const keys: string[] = RESUME_SECTION_DEFINITIONS.map((section) => section.key);
  const order = input.filter((key) => keys.includes(key));
  for (const key of keys) {
    if (!order.includes(key)) order.push(key);
  }
  return order;
}

const SECTION_TITLES: Record<string, string> = Object.fromEntries(
  RESUME_SECTION_DEFINITIONS.map((section) => [section.key, section.title]),
);

const COLOR_PRESETS = [
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Emerald", hex: "#059669" },
  { name: "Sky", hex: "#0284c7" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Slate", hex: "#334155" },
  { name: "Amber", hex: "#d97706" },
  { name: "Teal", hex: "#0d9488" },
];

function getItemLabel(sectionKey: string, item: Record<string, unknown>): string {
  switch (sectionKey) {
    case "experience":
      return `${String(item.role ?? "Role")} · ${String(item.organization ?? "")}`;
    case "education":
      return `${String(item.degree ?? "Degree")} · ${String(item.institution ?? "")}`;
    case "skills":
      return String(item.name ?? "Skill group");
    case "projects":
      return String(item.title ?? "Project");
    case "certifications":
      return `${String(item.title ?? "Cert")} · ${String(item.issuer ?? "")}`;
    case "achievements":
      return String(item.title ?? "Achievement");
    default:
      return String(item.title || item.name || item.id || "Item");
  }
}

export function ResumeStudio({
  versionId,
  title: initialTitle,
  summary: initialSummary,
  config: rawConfig,
  content: rawContent,
}: {
  versionId: string;
  title: string;
  summary: string | null;
  config: unknown;
  content: unknown;
}) {
  const initial = normalizeResumeConfig(rawConfig);
  const parsed = useMemo(() => parseResumeContent(rawContent), [rawContent]);

  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary || parsed?.profile.summary || "");
  const [template, setTemplate] = useState(initial.template);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [fontFamily, setFontFamily] = useState<ResumeConfig["fontFamily"]>(initial.fontFamily);
  const [fontScale, setFontScale] = useState(initial.fontScale);
  const [showPhoto, setShowPhoto] = useState(initial.showPhoto);
  const [showInterests, setShowInterests] = useState(initial.showInterests);
  const [order, setOrder] = useState<string[]>(() => normalizeOrder(initial.sectionOrder));
  const [hidden, setHidden] = useState<string[]>(initial.hiddenSections);
  const [hiddenItems, setHiddenItems] = useState<string[]>(initial.hiddenItems ?? []);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [copiedText, setCopiedText] = useState(false);

  const previewContent = useMemo(() => {
    if (!parsed) return null;
    return {
      ...parsed,
      profile: { ...parsed.profile, summary },
      sections: parsed.sections.map((section) =>
        section.key === "summary"
          ? { ...section, items: [{ id: "summary", text: summary }] }
          : section,
      ),
    };
  }, [parsed, summary]);

  const previewConfig: ResumeConfig = {
    template,
    accentColor,
    fontFamily,
    fontScale,
    showPhoto,
    showInterests,
    sectionOrder: order,
    hiddenSections: hidden,
    hiddenItems,
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const toggleItem = (id: string) => {
    setHiddenItems((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  const copyAsPlainText = () => {
    if (!previewContent) return;
    const lines: string[] = [];
    const prof = previewContent.profile;

    lines.push(prof.name.toUpperCase());
    lines.push(prof.title);
    lines.push(
      [prof.email, prof.phone, prof.location, ...prof.links.map((l) => l.url)]
        .filter(Boolean)
        .join(" | "),
    );
    lines.push("");

    if (summary.trim()) {
      lines.push("=== PROFESSIONAL SUMMARY ===");
      lines.push(summary.trim());
      lines.push("");
    }

    const sectionsMap = new Map(previewContent.sections.map((s) => [s.key, s]));

    for (const key of order) {
      if (hidden.includes(key) || key === "summary") continue;
      const sec = sectionsMap.get(key);
      if (!sec) continue;

      const items = (sec.items as Array<Record<string, unknown>>).filter(
        (it) => !hiddenItems.includes(String(it.id)),
      );
      if (!items.length) continue;

      lines.push(`=== ${sec.title.toUpperCase()} ===`);

      if (key === "experience") {
        for (const item of items) {
          const dates = [item.startDate?.toString().slice(0, 10), item.isCurrent ? "Present" : item.endDate?.toString().slice(0, 10)]
            .filter(Boolean)
            .join(" - ");
          lines.push(`${item.role} | ${item.organization} (${dates})`);
          if (item.description) lines.push(String(item.description));
          if (Array.isArray(item.highlights)) {
            for (const h of item.highlights) lines.push(`• ${h}`);
          }
          lines.push("");
        }
      } else if (key === "education") {
        for (const item of items) {
          lines.push(`${item.degree} - ${item.institution} (${item.startYear} - ${item.endYear || "Present"})`);
          if (item.grade) lines.push(`Grade: ${item.grade}`);
          if (item.description) lines.push(String(item.description));
          lines.push("");
        }
      } else if (key === "skills") {
        for (const grp of items) {
          const s = Array.isArray(grp.skills) ? grp.skills.map((x: { name: string }) => x.name).join(", ") : "";
          lines.push(`${grp.name}: ${s}`);
        }
        lines.push("");
      } else if (key === "projects") {
        for (const item of items) {
          lines.push(`${item.title} (${item.category})`);
          if (item.description) lines.push(String(item.description));
          if (Array.isArray(item.techStack)) lines.push(`Tech: ${item.techStack.join(", ")}`);
          lines.push("");
        }
      } else {
        for (const item of items) {
          lines.push(getItemLabel(key, item));
          if (item.description) lines.push(String(item.description));
          lines.push("");
        }
      }
    }

    if (showInterests && prof.interests?.length) {
      lines.push("=== AREAS OF INTEREST ===");
      lines.push(prof.interests.join(" • "));
      lines.push("");
    }

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="grid items-start gap-5 2xl:grid-cols-[21rem_minmax(0,1fr)]">
      {/* Design Controls Sidebar */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-semibold">Design & Content Studio</h2>
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
            Adjust templates, typography, section order, and toggle individual items.
          </p>
        </div>
        <div className="p-4">
          <ActionForm
            action={saveResumeConfigAction}
            submitLabel="Save draft"
            footerClassName="mt-4 flex items-center justify-end border-t border-border pt-4"
          >
            <input type="hidden" name="versionId" value={versionId} />
            <input type="hidden" name="sectionOrder" value={order.join(",")} />
            {hiddenItems.map((id) => (
              <input key={id} type="hidden" name="hiddenItems" value={id} />
            ))}

            <div className="space-y-4">
              <Field label="Version title" htmlFor="resume-title">
                <Input
                  id="resume-title"
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  maxLength={120}
                />
              </Field>

              <Field
                label="Professional summary"
                htmlFor="resume-summary"
                hint="Draft summary snapshot. Updates are applied live to the preview."
              >
                <Textarea
                  id="resume-summary"
                  name="summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  maxLength={2500}
                  className="min-h-24 text-[12px]"
                />
              </Field>

              {/* Template Picker */}
              <Field label="Template layout" htmlFor="resume-template">
                <Select
                  id="resume-template"
                  name="template"
                  value={template}
                  onChange={(event) => setTemplate(event.target.value)}
                >
                  {RESUME_TEMPLATE_LAYOUTS.map((layout) => (
                    <option key={layout.value} value={layout.value}>
                      {layout.label} — {layout.description}
                    </option>
                  ))}
                </Select>
              </Field>

              {/* Accent Color & Quick Presets */}
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                  <Palette className="h-3.5 w-3.5 text-accent" aria-hidden />
                  Accent colour
                </p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setAccentColor(preset.hex)}
                      className={`h-5 w-5 rounded-full transition-transform ${
                        accentColor.toLowerCase() === preset.hex.toLowerCase()
                          ? "ring-2 ring-foreground ring-offset-2 scale-110"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      title={`${preset.name} (${preset.hex})`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(event) => setAccentColor(event.target.value)}
                    className="h-9 w-11 cursor-pointer rounded-lg border border-border bg-card p-1"
                    aria-label="Choose accent colour"
                  />
                  <Input
                    name="accentColor"
                    value={accentColor}
                    onChange={(event) => setAccentColor(event.target.value)}
                    pattern="^#[0-9a-fA-F]{6}$"
                    required
                    maxLength={7}
                    aria-label="Accent colour hex value"
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              {/* Typeface and Photo */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Typeface" htmlFor="resume-font">
                  <Select
                    id="resume-font"
                    name="fontFamily"
                    value={fontFamily}
                    onChange={(event) =>
                      setFontFamily(event.target.value === "SERIF" ? "SERIF" : "SANS")
                    }
                  >
                    <option value="SANS">Sans serif</option>
                    <option value="SERIF">Serif</option>
                  </Select>
                </Field>
                <Field label="Photo" htmlFor="resume-photo">
                  <span className="flex h-10 items-center rounded-xl border border-input bg-card px-3">
                    <input
                      id="resume-photo"
                      type="checkbox"
                      name="showPhoto"
                      checked={showPhoto}
                      onChange={(event) => setShowPhoto(event.target.checked)}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      {showPhoto ? "Included" : "Hidden"}
                    </span>
                  </span>
                </Field>
              </div>

              {/* Font Scaling */}
              <Field label={`Font scale · ${Math.round(fontScale * 100)}%`} htmlFor="resume-scale">
                <input
                  id="resume-scale"
                  type="range"
                  name="fontScale"
                  min={0.85}
                  max={1.15}
                  step={0.01}
                  value={fontScale}
                  onChange={(event) => setFontScale(Number(event.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-[var(--accent)]"
                />
              </Field>

              <Checkbox
                name="showInterests"
                label="Show areas of interest"
                description="Appends the profile interests below the resume sections."
                checked={showInterests}
                onChange={(event) => setShowInterests(event.target.checked)}
              />

              {/* Section Order & Item-Level Customizer */}
              <div>
                <p className="mb-1 text-xs font-medium">Sections & Item Toggles</p>
                <p className="mb-2 text-[10px] text-muted-foreground">
                  Reorder sections or expand any section to toggle individual items.
                </p>
                <ul className="space-y-2">
                  {order.map((key, index) => {
                    const isHidden = hidden.includes(key);
                    const sec = parsed?.sections.find((s) => s.key === key);
                    const items = (sec?.items as Array<Record<string, unknown>>) || [];
                    const isExpanded = expandedSection === key;
                    const visibleItemCount = items.filter(
                      (it) => !hiddenItems.includes(String(it.id)),
                    ).length;

                    return (
                      <li
                        key={key}
                        className={`rounded-lg border transition-colors ${
                          isHidden
                            ? "border-border/60 bg-muted/10 opacity-70"
                            : "border-border bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 px-2.5 py-1.5">
                          <input
                            type="checkbox"
                            name="hiddenSections"
                            value={key}
                            checked={isHidden}
                            onChange={(event) =>
                              setHidden((current) =>
                                event.target.checked
                                  ? [...current, key]
                                  : current.filter((entry) => entry !== key),
                              )
                            }
                            className="h-3.5 w-3.5 accent-[var(--accent)]"
                            aria-label={`Hide ${SECTION_TITLES[key] || key}`}
                          />
                          <span
                            className={
                              isHidden
                                ? "flex-1 text-[11px] text-muted-foreground line-through"
                                : "flex-1 text-[11px] font-medium"
                            }
                          >
                            {SECTION_TITLES[key] || key}
                          </span>

                          {items.length > 0 && key !== "summary" ? (
                            <button
                              type="button"
                              onClick={() => setExpandedSection(isExpanded ? null : key)}
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="Toggle individual items"
                            >
                              <span>
                                {visibleItemCount}/{items.length}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="h-2.5 w-2.5" />
                              ) : (
                                <ChevronRight className="h-2.5 w-2.5" />
                              )}
                            </button>
                          ) : null}

                          <span className="font-mono text-[9px] text-muted-foreground">
                            {index + 1}
                          </span>
                          <span className="flex gap-0.5">
                            <button
                              type="button"
                              onClick={() => move(index, -1)}
                              disabled={index === 0}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                              aria-label={`Move ${SECTION_TITLES[key] || key} up`}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => move(index, 1)}
                              disabled={index === order.length - 1}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                              aria-label={`Move ${SECTION_TITLES[key] || key} down`}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </span>
                        </div>

                        {/* Collapsible item-level checklist */}
                        {isExpanded && items.length > 0 && key !== "summary" ? (
                          <div className="border-t border-border/60 bg-card/60 p-2 text-[10px]">
                            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Include / Exclude {SECTION_TITLES[key] || key}
                            </p>
                            <div className="max-h-36 space-y-1 overflow-y-auto">
                              {items.map((it) => {
                                const itemId = String(it.id);
                                const isItemHidden = hiddenItems.includes(itemId);
                                return (
                                  <label
                                    key={itemId}
                                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-muted/40"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!isItemHidden}
                                      onChange={() => toggleItem(itemId)}
                                      className="h-3 w-3 accent-[var(--accent)]"
                                    />
                                    <span
                                      className={`truncate ${
                                        isItemHidden
                                          ? "text-muted-foreground line-through opacity-60"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {getItemLabel(key, it)}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </ActionForm>
        </div>
      </section>

      {/* Live Preview Pane */}
      <section className="min-w-0 2xl:sticky 2xl:top-20">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold">Live Preview</h2>
            <p className="text-[10px] text-muted-foreground">
              Layout: <span className="font-medium capitalize text-foreground">{template}</span> · Font: {fontFamily} · Scale: {Math.round(fontScale * 100)}%
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Zoom Controls */}
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(75, prev - 10))}
                className="p-1 text-muted-foreground hover:text-foreground"
                title="Zoom out"
              >
                <ZoomOut className="h-3 w-3" />
              </button>
              <span className="px-1.5 font-mono text-[9px]">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(125, prev + 10))}
                className="p-1 text-muted-foreground hover:text-foreground"
                title="Zoom in"
              >
                <ZoomIn className="h-3 w-3" />
              </button>
            </div>

            {/* Copy Plain Text */}
            <button
              type="button"
              onClick={copyAsPlainText}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-card px-2 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              title="Copy plain-text formatted resume to clipboard (great for ATS & job forms)"
            >
              {copiedText ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy ATS Text</span>
                </>
              )}
            </button>

            {/* Direct PDF Download */}
            <a
              href={`/api/admin/resume/${versionId}/pdf`}
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-accent px-2.5 text-[10px] font-medium text-accent-foreground shadow-sm transition-opacity hover:opacity-90"
              title="Download PDF generated from this snapshot"
            >
              <Download className="h-3 w-3" />
              <span>PDF</span>
            </a>
          </div>
        </div>

        {/* Paper Container */}
        <div className="max-h-[82vh] overflow-auto rounded-2xl border border-border bg-neutral-200/70 p-4 shadow-inner dark:bg-neutral-900/70">
          <div
            className="mx-auto w-full max-w-[210mm] transition-transform duration-150 origin-top shadow-[0_20px_60px_-30px_rgba(0,0,0,0.45)]"
            style={{ transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined }}
          >
            <ResumeDocument content={previewContent} config={previewConfig} />
          </div>
        </div>
      </section>
    </div>
  );
}
