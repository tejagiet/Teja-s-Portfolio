import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["PAGE_VIEW"]);

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    if (/bot|crawler|spider|preview|lighthouse|headless/i.test(userAgent)) {
      return new NextResponse(null, { status: 204 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const key = createHash("sha256")
      .update(`${process.env.ANALYTICS_SALT || "analytics"}::${ip}`)
      .digest("hex")
      .slice(0, 24);

    const limit = checkRateLimit(`analytics:${key}`, 90, 60 * 1000);
    if (!limit.allowed) return new NextResponse(null, { status: 204 });

    const body = (await request.json()) as {
      type?: string;
      path?: string;
      referrer?: string | null;
    };

    const type = body.type && ALLOWED_TYPES.has(body.type) ? body.type : "PAGE_VIEW";
    const path = typeof body.path === "string" ? body.path.slice(0, 300) : null;
    if (!path || !path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) {
      return new NextResponse(null, { status: 204 });
    }

    let referrer: string | null = null;
    if (body.referrer) {
      try {
        const parsed = new URL(body.referrer);
        referrer = `${parsed.hostname}${parsed.pathname}`.slice(0, 400);
      } catch {
        referrer = null;
      }
    }

    const existingSession = request.cookies.get("tm_session")?.value;
    const sessionId = existingSession || randomUUID();
    const device = /mobile|android|iphone|ipad/i.test(userAgent) ? "mobile" : "desktop";

    await db.analyticsEvent.create({
      data: { type, path, referrer, sessionId, device },
    });

    const response = new NextResponse(null, { status: 204 });
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
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
