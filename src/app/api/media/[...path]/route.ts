import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const filename = segments.join("/");
  const extension = path.extname(filename).slice(1).toLowerCase();

  if (!TYPES[extension] || filename.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const directory = path.join(process.cwd(), ".data", "uploads");
  const resolved = path.resolve(directory, path.basename(filename));
  if (!resolved.startsWith(path.resolve(directory))) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(resolved);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": TYPES[extension],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
