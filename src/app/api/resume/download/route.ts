import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { getLatestPublishedResume } from "@/lib/resume-engine";
import { generateResumePdf } from "@/lib/resume-pdf";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const settings = await getSiteSettings();
  if (!settings.resumePublicEnabled) {
    return new NextResponse("Resume downloads are currently disabled.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const resume = await getLatestPublishedResume();
  if (!resume) {
    return new NextResponse("No approved resume is available yet.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const bytes = await generateResumePdf({
      content: resume.content,
      config: resume.config,
      templateName: resume.template.name,
    });

    const userAgent = request.headers.get("user-agent") || "";
    const existingSession = request.cookies.get("tm_session")?.value;
    const sessionId = existingSession || randomUUID();

    await db.analyticsEvent
      .create({
        data: {
          type: "RESUME_DOWNLOAD",
          path: "/resume",
          sessionId,
          device: /mobile|android|iphone|ipad/i.test(userAgent) ? "mobile" : "desktop",
          referrer: request.headers.get("referer")?.slice(0, 400) || null,
        },
      })
      .catch(() => undefined);

    const date = new Date().toISOString().slice(0, 10);
    const response = new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Teja-Manikanta-Resume-${date}.pdf"`,
        "Cache-Control": "no-store",
      },
    });

    if (!existingSession) {
      response.cookies.set("tm_session", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 180,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("[resume-download]", error);
    return new NextResponse("The resume could not be generated right now.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
