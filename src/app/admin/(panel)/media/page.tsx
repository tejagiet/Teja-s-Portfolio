import type { Metadata } from "next";
import { Folder } from "lucide-react";

import { ActionForm } from "@/components/admin/action-form";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { CopyButton } from "@/components/admin/copy-button";
import { ListToolbar } from "@/components/admin/collection";
import { MediaAltEditor } from "@/components/admin/media-alt-editor";
import { PageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/form";
import Image from "next/image";
import { deleteMediaAction, updateMediaAltAction, uploadMediaFormAction } from "@/lib/actions/media";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Media library" };

export const dynamic = "force-dynamic";

const DEFAULT_FOLDERS = ["portfolio", "projects", "profile", "admin-avatar", "media"];

function formatBytes(bytes: number | null) {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; folder?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const folder = params.folder?.trim() || "";

  const where = {
    ...(folder ? { folder } : {}),
    ...(q
      ? {
          OR: [
            { altText: { contains: q, mode: "insensitive" as const } },
            { url: { contains: q, mode: "insensitive" as const } },
            { publicId: { contains: q, mode: "insensitive" as const } },
            { folder: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [assets, folders, totals] = await Promise.all([
    db.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    db.mediaAsset.groupBy({ by: ["folder"], _count: { _all: true }, orderBy: { folder: "asc" } }),
    db.mediaAsset.aggregate({ _count: { _all: true }, _sum: { bytes: true } }),
  ]);

  const missingAlt = assets.filter((asset) => !asset.altText?.trim()).length;
  const local = assets.filter((asset) => asset.provider === "LOCAL").length;
  const cloudinary = assets.filter((asset) => asset.provider === "CLOUDINARY").length;
  const folderNames = Array.from(new Set([...DEFAULT_FOLDERS, ...folders.map((entry) => entry.folder)]));

  return (
    <div>
      <PageHeader
        eyebrow="Publishing"
        title="Media library"
        description="Every uploaded image is optimized to WebP and stored with its dimensions and alt text. Use descriptive alt text for images that appear in public content."
        actions={
          <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[11px] text-muted-foreground">
            {totals._count._all} asset{totals._count._all === 1 ? "" : "s"} · {formatBytes(totals._sum.bytes)}
          </span>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Assets shown", value: assets.length },
          { label: "Storage used", value: formatBytes(totals._sum.bytes) },
          { label: "Missing alt text", value: missingAlt },
          { label: "Providers", value: `${cloudinary} Cloudinary · ${local} local` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card px-3 py-2">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0">
          <ListToolbar
            defaultValue={q}
            placeholder="Search alt text, filename or folder…"
            hidden={folder ? [{ name: "folder", value: folder }] : undefined}
          >
            <select
              name="folder"
              defaultValue={folder}
              className="h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground"
              aria-label="Filter by folder"
            >
              <option value="">All folders</option>
              {folderNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </ListToolbar>

          {assets.length ? (
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {assets.map((asset) => (
                <article
                  key={asset.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-accent/25"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image
                      src={asset.secureUrl || asset.url}
                      alt={asset.altText || "Uploaded media asset"}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="object-cover"
                    />
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white backdrop-blur">
                      <Folder className="h-2.5 w-2.5" aria-hidden />
                      {asset.folder}
                    </span>
                    <span className="absolute right-2 top-2">
                      <Badge tone={asset.provider === "CLOUDINARY" ? "accent" : "neutral"}>
                        {asset.provider === "CLOUDINARY" ? "Cloudinary" : "Local"}
                      </Badge>
                    </span>
                  </div>

                  <div className="space-y-2.5 p-3">
                    <div>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {asset.publicId || asset.url}
                      </p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">
                        {asset.format?.toUpperCase() || "WEBP"}
                        {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""} ·{" "}
                        {formatBytes(asset.bytes)} · {formatDateTime(asset.createdAt)}
                      </p>
                    </div>

                    <MediaAltEditor
                      id={asset.id}
                      altText={asset.altText}
                      action={updateMediaAltAction}
                    />

                    <div className="flex flex-wrap items-center gap-1.5">
                      <CopyButton value={asset.secureUrl || asset.url} label="Copy URL" />
                      <a
                        href={asset.secureUrl || asset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-7 items-center rounded-md border border-border px-2 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        Open
                      </a>
                      <span className="ml-auto">
                        <ConfirmDelete
                          id={asset.id}
                          name={asset.altText || asset.publicId || "this image"}
                          action={deleteMediaAction}
                          size="icon"
                          description="The image is removed from the media library and from Cloudinary or local storage. Content that still references its URL will show a broken image."
                        />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="Images"
              title={q || folder ? "No media matches these filters" : "No media yet"}
              description={
                q || folder
                  ? "Try a different search term or clear the folder filter."
                  : "Upload an image using the form on the right. Uploads are cropped, resized and converted to WebP automatically."
              }
            />
          )}
        </div>

        <div className="space-y-4 xl:sticky xl:top-20">
          <Panel
            title="Upload an image"
            description="JPEG, PNG, WebP, AVIF or GIF up to 8 MB. The server optimizes the file before storing it."
          >
            <ActionForm
              action={uploadMediaFormAction}
              submitLabel="Upload image"
              pendingLabel="Uploading…"
              resetOnSuccess
              footerClassName="mt-4 flex items-center justify-end border-t border-border pt-4"
            >
              <div className="space-y-3">
                <Field label="Image file" htmlFor="file" hint="A descriptive filename is kept for search.">
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    required
                    className="h-auto py-2 text-[11px] file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-foreground"
                  />
                </Field>
                <Field label="Folder" htmlFor="folder" hint="Group related media together.">
                  <Input
                    id="folder"
                    name="folder"
                    list="media-folders"
                    defaultValue={folder || "portfolio"}
                    maxLength={80}
                  />
                  <datalist id="media-folders">
                    {folderNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </Field>
                <Field
                  label="Alt text"
                  htmlFor="alt"
                  hint="Describe the image for screen readers and search engines."
                >
                  <Input id="alt" name="alt" maxLength={300} placeholder="Project dashboard screenshot" />
                </Field>
              </div>
            </ActionForm>
          </Panel>

          <div className="rounded-2xl border border-border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
            <p className="text-xs font-semibold text-foreground">Folders</p>
            <ul className="mt-2 space-y-1.5">
              {folders.length ? (
                folders.map((entry) => (
                  <li key={entry.folder} className="flex items-center justify-between gap-2">
                    <a
                      href={`/admin/media?folder=${encodeURIComponent(entry.folder)}`}
                      className="truncate hover:text-foreground"
                    >
                      {entry.folder}
                    </a>
                    <span className="tabular-nums">{entry._count._all}</span>
                  </li>
                ))
              ) : (
                <li>No folders yet.</li>
              )}
            </ul>
            <p className="mt-3 border-t border-border pt-3">
              Alt text is required for project gallery images. Media library alt text is optional until an asset is
              used in public content.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 text-[10px] leading-relaxed text-muted-foreground">
            <p className="text-xs font-semibold text-foreground">Storage mode</p>
            <p className="mt-1.5">
              {cloudinary > 0
                ? "Cloudinary is serving at least one asset."
                : "No Cloudinary assets are recorded yet."}{" "}
              {local > 0
                ? "Local uploads are served from /api/media and are suitable for development only."
                : "Local storage is not in use."}
            </p>
            <p className="mt-2">
              Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET before deploying to
              production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
