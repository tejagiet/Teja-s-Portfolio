import "server-only";

import sharp from "sharp";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

import {
  normalizeResumeConfig,
  parseResumeContent,
  type ResumeConfig,
} from "@/lib/resume-types";
import { formatDate } from "@/lib/utils";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

type Fonts = { regular: PDFFont; bold: PDFFont };

function hexToRgb(hex: string) {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : "4f46e5";
  return rgb(
    parseInt(normalized.slice(0, 2), 16) / 255,
    parseInt(normalized.slice(2, 4), 16) / 255,
    parseInt(normalized.slice(4, 6), 16) / 255,
  );
}

function sanitize(text: string) {
  return text
    .replace(/\u2013|\u2014/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "")
    .replace(/[^\x09\x0A\x20-\xFF]/g, "");
}

function wrapText(text: string, font: PDFFont, size: number, width: number) {
  const paragraphs = sanitize(text).split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        if (font.widthOfTextAtSize(word, size) > width) {
          let fragment = "";
          for (const char of word) {
            if (font.widthOfTextAtSize(fragment + char, size) > width) {
              lines.push(fragment);
              fragment = char;
            } else {
              fragment += char;
            }
          }
          current = fragment;
        } else {
          current = word;
        }
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

async function loadPhoto(
  pdf: PDFDocument,
  photoUrl: string | null,
): Promise<PDFImage | null> {
  if (!photoUrl) return null;
  try {
    const absolute = photoUrl.startsWith("/")
      ? new URL(photoUrl, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").toString()
      : photoUrl;
    const response = await fetch(absolute, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const jpeg = await sharp(buffer)
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 88 })
      .toBuffer();
    return await pdf.embedJpg(jpeg);
  } catch (error) {
    console.warn("[resume-pdf] photo could not be embedded", error);
    return null;
  }
}

type Cursor = {
  page: PDFPage;
  y: number;
};

export async function generateResumePdf(options: {
  content: unknown;
  config: unknown;
  templateName?: string;
}) {
  const content = parseResumeContent(options.content);
  if (!content) throw new Error("Resume content is missing.");

  const config: ResumeConfig = normalizeResumeConfig(options.config);
  const template = config.template || "modern";
  const isClassic = template === "classic";
  const isMinimal = template === "minimal";
  const isCompact = template === "compact";

  const margin = isCompact ? 34 : 46;
  const contentWidth = PAGE_WIDTH - margin * 2;

  const accent = hexToRgb(config.accentColor);
  const ink = rgb(0.09, 0.1, 0.12);
  const muted = rgb(0.36, 0.38, 0.42);
  const rule = rgb(0.85, 0.86, 0.88);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${content.profile.name} — Resume`);
  pdf.setAuthor(content.profile.name);
  pdf.setSubject(content.profile.title);
  pdf.setCreator("Teja Manikanta Portfolio");

  const serif = config.fontFamily === "SERIF" || isClassic;
  const fonts: Fonts = {
    regular: await pdf.embedFont(serif ? StandardFonts.TimesRoman : StandardFonts.Helvetica),
    bold: await pdf.embedFont(
      serif ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold,
    ),
  };

  const scale = config.fontScale;
  const bodySize = (isCompact ? 8.8 : 9.4) * scale;
  const smallSize = (isCompact ? 7.8 : 8.4) * scale;
  const lineHeight = bodySize * (isCompact ? 1.3 : 1.42);
  const bottomLimit = margin + 26;

  const photo = config.showPhoto ? await loadPhoto(pdf, content.profile.photoUrl) : null;
  const photoSize = isCompact ? 60 : 72;

  let cursor: Cursor = {
    page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - margin,
  };

  const ensure = (needed: number) => {
    if (cursor.y - needed < bottomLimit) {
      cursor = {
        page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
        y: PAGE_HEIGHT - margin,
      };
    }
  };

  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
    color = ink,
  ) => {
    cursor.page.drawText(sanitize(text), { x, y, size, font, color });
  };

  const drawRight = (text: string, rightX: number, y: number, size: number) => {
    const value = sanitize(text);
    const width = fonts.regular.widthOfTextAtSize(value, size);
    cursor.page.drawText(value, {
      x: rightX - width,
      y,
      size,
      font: fonts.regular,
      color: muted,
    });
  };

  const drawParagraph = (text: string, width = contentWidth, size = bodySize) => {
    const lines = wrapText(text, fonts.regular, size, width);
    for (const line of lines) {
      ensure(lineHeight);
      if (line) {
        cursor.page.drawText(line, {
          x: margin,
          y: cursor.y,
          size,
          font: fonts.regular,
          color: muted,
        });
      }
      cursor.y -= lineHeight;
    }
  };

  const drawHeading = (title: string) => {
    ensure(isCompact ? 28 : 38);
    cursor.y -= isCompact ? 6 : 10;

    if (isClassic) {
      const headingText = sanitize(title.toUpperCase());
      const size = 9.2 * scale;
      const textWidth = fonts.bold.widthOfTextAtSize(headingText, size);
      const centerX = (PAGE_WIDTH - textWidth) / 2;
      cursor.page.drawText(headingText, {
        x: centerX,
        y: cursor.y + 6,
        size,
        font: fonts.bold,
        color: accent,
      });
      cursor.page.drawLine({
        start: { x: margin, y: cursor.y + 2 },
        end: { x: PAGE_WIDTH - margin, y: cursor.y + 2 },
        thickness: 0.6,
        color: rule,
      });
      cursor.y -= 14;
    } else if (isMinimal) {
      const headingText = sanitize(title.toUpperCase());
      cursor.page.drawText(headingText, {
        x: margin,
        y: cursor.y + 7,
        size: 8.8 * scale,
        font: fonts.bold,
        color: muted,
      });
      cursor.page.drawLine({
        start: { x: margin, y: cursor.y + 2 },
        end: { x: PAGE_WIDTH - margin, y: cursor.y + 2 },
        thickness: 0.4,
        color: rgb(0.88, 0.88, 0.9),
      });
      cursor.y -= 14;
    } else if (isCompact) {
      cursor.page.drawRectangle({
        x: margin,
        y: cursor.y + 7,
        width: 10,
        height: 2,
        color: accent,
      });
      cursor.page.drawText(sanitize(title.toUpperCase()), {
        x: margin + 15,
        y: cursor.y + 5,
        size: 8.6 * scale,
        font: fonts.bold,
        color: accent,
      });
      cursor.page.drawLine({
        start: { x: margin, y: cursor.y + 1 },
        end: { x: PAGE_WIDTH - margin, y: cursor.y + 1 },
        thickness: 0.5,
        color: rule,
      });
      cursor.y -= 12;
    } else {
      // Modern
      cursor.page.drawRectangle({
        x: margin,
        y: cursor.y + 13,
        width: 18,
        height: 2.5,
        color: accent,
      });
      cursor.page.drawText(sanitize(title.toUpperCase()), {
        x: margin + 25,
        y: cursor.y + 8.5,
        size: 9.2 * scale,
        font: fonts.bold,
        color: accent,
      });
      cursor.page.drawLine({
        start: { x: margin, y: cursor.y + 3 },
        end: { x: PAGE_WIDTH - margin, y: cursor.y + 3 },
        thickness: 0.6,
        color: rule,
      });
      cursor.y -= 15;
    }
  };

  // Header -----------------------------------------------------------------
  const contactParts = [
    content.profile.email,
    content.profile.phone,
    content.profile.location,
    ...content.profile.links.slice(0, 2).map((link) => link.url.replace(/^https?:\/\//, "")),
  ].filter(Boolean) as string[];

  if (isClassic) {
    // Classic: Centered header, elegant serif, no top color bar
    if (photo) {
      const photoX = (PAGE_WIDTH - photoSize) / 2;
      const photoY = cursor.y - photoSize;
      cursor.page.drawImage(photo, {
        x: photoX,
        y: photoY,
        width: photoSize,
        height: photoSize,
      });
      cursor.y -= photoSize + 8;
    }

    const nameText = sanitize(content.profile.name);
    const nameSize = 22 * scale;
    const nameWidth = fonts.bold.widthOfTextAtSize(nameText, nameSize);
    cursor.page.drawText(nameText, {
      x: (PAGE_WIDTH - nameWidth) / 2,
      y: cursor.y - 18,
      size: nameSize,
      font: fonts.bold,
      color: ink,
    });
    cursor.y -= 32;

    const titleText = sanitize(content.profile.title);
    const titleSize = 10 * scale;
    const titleWidth = fonts.regular.widthOfTextAtSize(titleText, titleSize);
    cursor.page.drawText(titleText, {
      x: (PAGE_WIDTH - titleWidth) / 2,
      y: cursor.y,
      size: titleSize,
      font: fonts.regular,
      color: accent,
    });
    cursor.y -= 14;

    if (contactParts.length) {
      const line = contactParts.join("  •  ");
      const lineWidth = fonts.regular.widthOfTextAtSize(line, 8.2 * scale);
      cursor.page.drawText(line, {
        x: Math.max(margin, (PAGE_WIDTH - lineWidth) / 2),
        y: cursor.y,
        size: 8.2 * scale,
        font: fonts.regular,
        color: muted,
      });
      cursor.y -= 12;
    }

    cursor.page.drawLine({
      start: { x: margin, y: cursor.y },
      end: { x: PAGE_WIDTH - margin, y: cursor.y },
      thickness: 1.2,
      color: ink,
    });
    cursor.y -= 10;
  } else if (isMinimal) {
    // Minimal: Clean, left-aligned, spacious
    cursor.page.drawText(sanitize(content.profile.name), {
      x: margin,
      y: cursor.y - 20,
      size: 21 * scale,
      font: fonts.bold,
      color: ink,
    });
    cursor.y -= 34;

    cursor.page.drawText(sanitize(content.profile.title), {
      x: margin,
      y: cursor.y,
      size: 10 * scale,
      font: fonts.regular,
      color: muted,
    });
    cursor.y -= 13;

    if (contactParts.length) {
      const line = contactParts.join("  /  ");
      cursor.page.drawText(line, {
        x: margin,
        y: cursor.y,
        size: 8.2 * scale,
        font: fonts.regular,
        color: muted,
      });
      cursor.y -= 12;
    }

    cursor.page.drawLine({
      start: { x: margin, y: cursor.y },
      end: { x: PAGE_WIDTH - margin, y: cursor.y },
      thickness: 0.5,
      color: rule,
    });
    cursor.y -= 8;
  } else if (isCompact) {
    // Compact: Header with left Name/Title, right contact info
    cursor.page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 3,
      width: PAGE_WIDTH,
      height: 3,
      color: accent,
    });

    cursor.page.drawText(sanitize(content.profile.name), {
      x: margin,
      y: cursor.y - 14,
      size: 18 * scale,
      font: fonts.bold,
      color: ink,
    });

    const contactSize = 7.5 * scale;
    let contactY = cursor.y - 8;
    for (const part of contactParts.slice(0, 3)) {
      drawRight(part, PAGE_WIDTH - margin, contactY, contactSize);
      contactY -= 10;
    }

    cursor.y -= 26;
    cursor.page.drawText(sanitize(content.profile.title), {
      x: margin,
      y: cursor.y,
      size: 9.5 * scale,
      font: fonts.regular,
      color: accent,
    });
    cursor.y -= 12;

    cursor.page.drawLine({
      start: { x: margin, y: cursor.y },
      end: { x: PAGE_WIDTH - margin, y: cursor.y },
      thickness: 0.6,
      color: rule,
    });
    cursor.y -= 6;
  } else {
    // Modern (default)
    cursor.page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 7,
      width: PAGE_WIDTH,
      height: 7,
      color: accent,
    });

    if (photo) {
      const photoX = PAGE_WIDTH - margin - photoSize;
      const photoY = PAGE_HEIGHT - margin - photoSize + 2;
      cursor.page.drawRectangle({
        x: photoX - 1.5,
        y: photoY - 1.5,
        width: photoSize + 3,
        height: photoSize + 3,
        color: accent,
        opacity: 0.35,
      });
      cursor.page.drawImage(photo, {
        x: photoX,
        y: photoY,
        width: photoSize,
        height: photoSize,
      });
    }

    cursor.page.drawText(sanitize(content.profile.name), {
      x: margin,
      y: cursor.y - 24,
      size: 24 * scale,
      font: fonts.bold,
      color: ink,
    });
    cursor.y -= 40;

    cursor.page.drawText(sanitize(content.profile.title), {
      x: margin,
      y: cursor.y,
      size: 10.5 * scale,
      font: fonts.regular,
      color: accent,
    });
    cursor.y -= 15;

    if (contactParts.length) {
      const line = contactParts.join("  ·  ");
      for (const wrapped of wrapText(line, fonts.regular, 8.4 * scale, contentWidth)) {
        cursor.page.drawText(wrapped, {
          x: margin,
          y: cursor.y,
          size: 8.4 * scale,
          font: fonts.regular,
          color: muted,
        });
        cursor.y -= 11;
      }
    }

    cursor.y -= 6;
  }

  // Sections ---------------------------------------------------------------
  const hiddenItemsSet = new Set(config.hiddenItems ?? []);
  const orderedSections = config.sectionOrder
    .map((key) => content.sections.find((section) => section.key === key))
    .filter((section) => section && !config.hiddenSections.includes(section.key));

  for (const section of orderedSections) {
    if (!section) continue;
    if (section.key === "summary") {
      if (!content.profile.summary.trim()) continue;
      drawHeading(section.title);
      drawParagraph(content.profile.summary);
      continue;
    }

    const rawItems = section.items as Array<Record<string, unknown>>;
    const items = rawItems.filter((item) => !hiddenItemsSet.has(String(item.id)));
    if (!items.length) continue;

    drawHeading(section.title);

    if (section.key === "experience") {
      for (const item of items) {
        const start = item.startDate ? formatDate(String(item.startDate)) : "";
        const end = item.isCurrent ? "Present" : item.endDate ? formatDate(String(item.endDate)) : "";
        const dates = [start, end].filter(Boolean).join(" — ");
        ensure(38);
        drawText(String(item.role ?? ""), margin, cursor.y, (isCompact ? 9.5 : 10.2) * scale, fonts.bold);
        if (dates) drawRight(dates, PAGE_WIDTH - margin, cursor.y, smallSize);
        cursor.y -= isCompact ? 10 : 12;

        const org = [item.organization, item.location].filter(Boolean).join(" · ");
        if (org) {
          drawText(String(org), margin, cursor.y, bodySize, fonts.regular, accent);
          cursor.y -= isCompact ? 10 : 12;
        }

        if (item.description) drawParagraph(String(item.description));

        const highlights = Array.isArray(item.highlights) ? (item.highlights as string[]) : [];
        for (const highlight of highlights) {
          const lines = wrapText(highlight, fonts.regular, bodySize, contentWidth - 12);
          lines.forEach((line, index) => {
            ensure(lineHeight);
            if (index === 0) {
              cursor.page.drawText("-", {
                x: margin + 2,
                y: cursor.y,
                size: bodySize,
                font: fonts.regular,
                color: accent,
              });
            }
            cursor.page.drawText(line, {
              x: margin + 12,
              y: cursor.y,
              size: bodySize,
              font: fonts.regular,
              color: muted,
            });
            cursor.y -= lineHeight;
          });
        }
        cursor.y -= isCompact ? 4 : 7;
      }
    }

    if (section.key === "education") {
      for (const item of items) {
        const dates = [item.startYear, item.isCurrent ? "Present" : item.endYear]
          .filter(Boolean)
          .join(" — ");
        ensure(34);
        drawText(
          [item.degree, item.field].filter(Boolean).join(", "),
          margin,
          cursor.y,
          (isCompact ? 9.5 : 10.2) * scale,
          fonts.bold,
        );
        if (dates) drawRight(String(dates), PAGE_WIDTH - margin, cursor.y, smallSize);
        cursor.y -= isCompact ? 10 : 12;

        drawText(String(item.institution ?? ""), margin, cursor.y, bodySize, fonts.regular, accent);
        if (item.grade) {
          drawRight(String(item.grade), PAGE_WIDTH - margin, cursor.y, smallSize);
        }
        cursor.y -= isCompact ? 10 : 12;
        if (item.description) drawParagraph(String(item.description));
        cursor.y -= isCompact ? 4 : 6;
      }
    }

    if (section.key === "skills") {
      for (const group of items) {
        const skills = Array.isArray(group.skills)
          ? (group.skills as Array<{ name: string }>).map((skill) => skill.name)
          : [];
        if (!skills.length) continue;
        const prefix = `${sanitize(String(group.name ?? "Skills"))}: `;
        const prefixWidth = fonts.bold.widthOfTextAtSize(prefix, bodySize);
        ensure(lineHeight);
        cursor.page.drawText(prefix, {
          x: margin,
          y: cursor.y,
          size: bodySize,
          font: fonts.bold,
          color: ink,
        });
        const available = contentWidth - prefixWidth;
        const lines = wrapText(skills.join(", "), fonts.regular, bodySize, available);
        if (lines.length === 1) {
          cursor.page.drawText(lines[0], {
            x: margin + prefixWidth,
            y: cursor.y,
            size: bodySize,
            font: fonts.regular,
            color: muted,
          });
          cursor.y -= lineHeight + 2;
        } else {
          cursor.y -= lineHeight;
          lines.forEach((line, index) => {
            ensure(lineHeight);
            cursor.page.drawText(line, {
              x: margin + (index === 0 ? prefixWidth : 0),
              y: cursor.y,
              size: bodySize,
              font: fonts.regular,
              color: muted,
            });
            cursor.y -= lineHeight;
          });
          cursor.y -= 2;
        }
      }
      cursor.y -= 4;
    }

    if (section.key === "projects") {
      for (const item of items) {
        ensure(32);
        drawText(String(item.title ?? ""), margin, cursor.y, (isCompact ? 9.2 : 10) * scale, fonts.bold);
        const category = String(item.category ?? "");
        if (category) drawRight(category, PAGE_WIDTH - margin, cursor.y, smallSize);
        cursor.y -= isCompact ? 10 : 12;

        if (item.description) drawParagraph(String(item.description));
        const tech = Array.isArray(item.techStack) ? (item.techStack as string[]).join(" · ") : "";
        if (tech) {
          const lines = wrapText(tech, fonts.regular, smallSize, contentWidth);
          for (const line of lines) {
            ensure(lineHeight);
            cursor.page.drawText(line, {
              x: margin,
              y: cursor.y,
              size: smallSize,
              font: fonts.regular,
              color: accent,
            });
            cursor.y -= 11;
          }
        }
        cursor.y -= isCompact ? 4 : 6;
      }
    }

    if (section.key === "certifications") {
      for (const item of items) {
        ensure(24);
        drawText(String(item.title ?? ""), margin, cursor.y, bodySize + 0.4, fonts.bold);
        if (item.issueDate) {
          drawRight(formatDate(String(item.issueDate)), PAGE_WIDTH - margin, cursor.y, smallSize);
        }
        cursor.y -= 11;
        drawText(String(item.issuer ?? ""), margin, cursor.y, smallSize, fonts.regular, accent);
        cursor.y -= isCompact ? 8 : 12;
      }
    }

    if (section.key === "achievements") {
      for (const item of items) {
        ensure(24);
        drawText(String(item.title ?? ""), margin, cursor.y, bodySize + 0.4, fonts.bold);
        if (item.date) {
          drawRight(formatDate(String(item.date)), PAGE_WIDTH - margin, cursor.y, smallSize);
        }
        cursor.y -= 11;
        if (item.description) drawParagraph(String(item.description));
        cursor.y -= isCompact ? 3 : 4;
      }
    }
  }

  if (config.showInterests && content.profile.interests.length) {
    drawHeading("Areas of Interest");
    drawParagraph(content.profile.interests.join(" · "));
  }

  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    page.drawLine({
      start: { x: margin, y: 34 },
      end: { x: PAGE_WIDTH - margin, y: 34 },
      thickness: 0.5,
      color: rule,
    });
    page.drawText(sanitize(content.profile.name), {
      x: margin,
      y: 22,
      size: 7.5,
      font: fonts.regular,
      color: muted,
    });
    const label = `${index + 1} / ${pages.length}`;
    const width = fonts.regular.widthOfTextAtSize(label, 7.5);
    page.drawText(label, {
      x: PAGE_WIDTH - margin - width,
      y: 22,
      size: 7.5,
      font: fonts.regular,
      color: muted,
    });
  });

  return pdf.save();
}
