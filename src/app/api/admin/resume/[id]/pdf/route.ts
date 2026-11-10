import { NextResponse } from "next/server";

import { logActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { generateResumePdf } from "@/lib/resume-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const version = await db.resumeVersion.findUnique({
    where: { id },
    include: { template: true },
  });
  if (!version) {
    return new NextResponse("Resume version not found.", { status: 404 });
  }

  try {
    const bytes = await generateResumePdf({
      content: version.content,
      config: version.config,
      templateName: version.template.name,
    });

    await logActivity({
      userId: user.id,
      action: "EXPORT",
      entityType: "resume",
      entityId: version.id,
      description: `Exported resume v${version.version} as PDF`,
    });

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Teja-Manikanta-Resume-v${version.version}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[admin-resume-pdf]", error);
    return new NextResponse("The PDF could not be generated.", { status: 500 });
  }
}
