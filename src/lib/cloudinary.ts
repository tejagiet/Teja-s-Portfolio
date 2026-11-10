import "server-only";

import { createHash } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";
import type { MediaProvider } from "@prisma/client";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export type UploadedImage = {
  publicId: string | null;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  provider: MediaProvider;
};

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function signParams(params: Record<string, string | number>) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(`${toSign}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");
}

export async function processImage(input: Buffer, maxDimension = 2200) {
  const image = sharp(input, { failOn: "none" }).rotate();
  const metadata = await image.metadata();
  const optimized = await image
    .resize({
      width: metadata.width && metadata.width > maxDimension ? maxDimension : undefined,
      height: metadata.height && metadata.height > maxDimension ? maxDimension : undefined,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 84, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: optimized.data,
    width: optimized.info.width,
    height: optimized.info.height,
    format: "webp" as const,
  };
}

export async function uploadImage(input: Buffer, options?: { folder?: string; mimeType?: string }) {
  if (!input.byteLength) throw new Error("The uploaded file is empty.");
  if (input.byteLength > MAX_BYTES) throw new Error("Images must be 8 MB or smaller.");
  if (options?.mimeType && !ALLOWED.has(options.mimeType)) {
    throw new Error("Only JPEG, PNG, WebP, AVIF and GIF images are supported.");
  }

  const image = await processImage(input);
  const folder = options?.folder || process.env.CLOUDINARY_FOLDER || "teja-portfolio";

  if (!isCloudinaryConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      );
    }
    const directory = path.join(process.cwd(), ".data", "uploads");
    await mkdir(directory, { recursive: true });
    const filename = `${crypto.randomUUID()}.webp`;
    await writeFile(path.join(directory, filename), image.buffer);
    const url = `/api/media/${filename}`;
    return {
      publicId: filename,
      url,
      secureUrl: url,
      format: "webp",
      width: image.width,
      height: image.height,
      bytes: image.buffer.byteLength,
      provider: "LOCAL" as const,
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  const signature = signParams(params);
  const body = new FormData();
  body.append("file", new Blob([new Uint8Array(image.buffer)], { type: "image/webp" }), "upload.webp");
  body.append("api_key", process.env.CLOUDINARY_API_KEY!);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body },
  );
  const result = (await response.json()) as {
    secure_url?: string;
    url?: string;
    public_id?: string;
    format?: string;
    width?: number;
    height?: number;
    bytes?: number;
    error?: { message?: string };
  };

  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || "Cloudinary upload failed.");
  }

  return {
    publicId: result.public_id ?? null,
    url: result.secure_url,
    secureUrl: result.secure_url,
    format: result.format ?? image.format,
    width: result.width ?? image.width,
    height: result.height ?? image.height,
    bytes: result.bytes ?? image.buffer.byteLength,
    provider: "CLOUDINARY" as const,
  };
}

export async function deleteMediaAsset(provider: MediaProvider, publicId: string | null) {
  if (!publicId) return;

  if (provider === "CLOUDINARY" && isCloudinaryConfigured()) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signParams({ public_id: publicId, timestamp });
    const body = new FormData();
    body.append("public_id", publicId);
    body.append("api_key", process.env.CLOUDINARY_API_KEY!);
    body.append("timestamp", String(timestamp));
    body.append("signature", signature);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
      { method: "POST", body },
    );
    if (!response.ok) {
      console.error("[cloudinary] delete failed", await response.text());
    }
    return;
  }

  if (provider === "LOCAL") {
    const directory = path.join(process.cwd(), ".data", "uploads");
    const resolved = path.resolve(directory, publicId);
    if (resolved.startsWith(path.resolve(directory))) {
      await unlink(resolved).catch(() => undefined);
    }
  }
}

export async function getMediaBuffer(url: string) {
  if (url.startsWith("/")) {
    const directory = path.join(process.cwd(), ".data", "uploads");
    const filename = path.basename(url);
    const resolved = path.resolve(directory, filename);
    if (!resolved.startsWith(path.resolve(directory))) throw new Error("Invalid path");
    const { readFile } = await import("node:fs/promises");
    return readFile(resolved);
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Image could not be fetched.");
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Returns an auto-optimized Cloudinary CDN URL with auto-format (f_auto)
 * and auto-quality (q_auto), plus optional dimension constraints.
 * Safe fallback for local development URLs (/api/media/...).
 */
export function getOptimizedImageUrl(
  urlOrPublicId: string,
  options?: { width?: number; height?: number; crop?: "fill" | "fit" | "limit" | "thumb" },
): string {
  if (!urlOrPublicId) return "";
  if (urlOrPublicId.startsWith("/")) return urlOrPublicId;

  if (urlOrPublicId.includes("res.cloudinary.com")) {
    const transforms = ["f_auto", "q_auto"];
    if (options?.width) transforms.push(`w_${options.width}`);
    if (options?.height) transforms.push(`h_${options.height}`);
    if (options?.crop) transforms.push(`c_${options.crop}`);

    const uploadIndex = urlOrPublicId.indexOf("/upload/");
    if (uploadIndex !== -1) {
      const prefix = urlOrPublicId.slice(0, uploadIndex + 8);
      const rest = urlOrPublicId.slice(uploadIndex + 8);
      return `${prefix}${transforms.join(",")}/${rest}`;
    }
  }

  return urlOrPublicId;
}

/**
 * Verifies Cloudinary API connectivity and credentials.
 */
export async function verifyCloudinaryHealth(): Promise<{
  configured: boolean;
  ok: boolean;
  cloudName: string | null;
  message: string;
}> {
  if (!isCloudinaryConfigured()) {
    return {
      configured: false,
      ok: false,
      cloudName: null,
      message: "Cloudinary credentials (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET) are missing.",
    };
  }

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/ping`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      return {
        configured: true,
        ok: true,
        cloudName,
        message: "Cloudinary API connected successfully.",
      };
    }

    const text = await response.text();
    return {
      configured: true,
      ok: false,
      cloudName,
      message: `Cloudinary ping returned status ${response.status}: ${text.slice(0, 100)}`,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
      message: error instanceof Error ? error.message : "Failed to connect to Cloudinary.",
    };
  }
}
