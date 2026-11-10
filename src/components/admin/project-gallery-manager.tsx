"use client";

import { Images, Loader2, Plus, Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ImageCropUpload } from "@/components/admin/image-crop-upload";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import type { ActionState } from "@/lib/validation";

type GalleryImage = { id: string; url: string; altText: string | null; sortOrder: number };

export function ProjectGalleryManager({
  projectId,
  images,
  uploadAction,
  addAction,
  updateAltAction,
  deleteAction,
}: {
  projectId: string;
  images: GalleryImage[];
  uploadAction: (formData: FormData) => Promise<ActionState>;
  addAction: (projectId: string, url: string, altText: string) => Promise<ActionState>;
  updateAltAction: (id: string, altText: string) => Promise<ActionState>;
  deleteAction: (id: string) => Promise<ActionState>;
}) {
  const [pendingUrl, setPendingUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [pending, startTransition] = useTransition();
  const [showLibrary, setShowLibrary] = useState(false);
  const router = useRouter();

  const add = () => {
    if (!pendingUrl) {
      toast.error("Upload an image first.");
      return;
    }
    if (!alt.trim()) {
      toast.error("Alt text is required for every gallery image.");
      return;
    }
    startTransition(async () => {
      const result = await addAction(projectId, pendingUrl, alt);
      if (result.status === "success") {
        toast.success(result.message || "Gallery image added.");
        setPendingUrl("");
        setAlt("");
        router.refresh();
      } else {
        toast.error(result.message || "The image could not be added.");
      }
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-xs font-semibold">Project gallery</h2>
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
          Add up to 12 screenshots or diagrams. Alt text is required and used by the SEO audit.
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <GalleryItem
            key={image.id}
            image={image}
            updateAltAction={updateAltAction}
            deleteAction={deleteAction}
          />
        ))}

        <div className="rounded-xl border border-dashed border-border p-3">
          <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-lg bg-muted/50">
            {pendingUrl ? (
              <Image
                src={pendingUrl}
                alt="Gallery preview"
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                quality={95}
                className="object-cover"
              />
            ) : (
              <span className="text-[10px] text-muted-foreground">No image selected</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">Add image:</span>
            <div className="flex items-center gap-1">
              <ImageCropUpload
                uploadAction={uploadAction}
                fields={{ folder: "projects" }}
                aspect={16 / 10}
                label="Upload"
                variant="ghost"
                onUploaded={setPendingUrl}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowLibrary(true)}
                title="Select existing image from media library"
              >
                <Images className="h-3.5 w-3.5" />
                Library
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <Label htmlFor="gallery-alt" className="text-[10px]">
              Alt text
            </Label>
            <Input
              id="gallery-alt"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Describe what the image shows"
              className="h-8 text-[11px]"
              maxLength={300}
            />
          </div>
          <Button type="button" size="sm" className="mt-2 w-full" onClick={add} disabled={pending}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add to gallery
          </Button>

          <MediaPickerModal
            open={showLibrary}
            onClose={() => setShowLibrary(false)}
            onSelect={(url) => {
              setPendingUrl(url);
              setShowLibrary(false);
            }}
            title="Choose Gallery Image from Media Library"
            currentUrl={pendingUrl}
          />
        </div>
      </div>
    </section>
  );
}

function GalleryItem({
  image,
  updateAltAction,
  deleteAction,
}: {
  image: GalleryImage;
  updateAltAction: (id: string, altText: string) => Promise<ActionState>;
  deleteAction: (id: string) => Promise<ActionState>;
}) {
  const [alt, setAlt] = useState(image.altText || "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = () => {
    startTransition(async () => {
      const result = await updateAltAction(image.id, alt);
      if (result.status === "success") {
        toast.success(result.message || "Alt text updated.");
        router.refresh();
      } else {
        toast.error(result.message || "Alt text could not be updated.");
      }
    });
  };

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-lg bg-muted/50">
        <Image src={image.url} alt={image.altText || "Project gallery image"} fill sizes="320px" className="object-cover" />
      </div>
      <div className="mt-2">
        <Label htmlFor={`gallery-alt-${image.id}`} className="text-[10px]">
          Alt text
        </Label>
        <div className="flex gap-1.5">
          <Input
            id={`gallery-alt-${image.id}`}
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            className="h-8 text-[11px]"
            maxLength={300}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={save}
            disabled={pending || alt.trim() === (image.altText || "")}
            aria-label="Save alt text"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <ConfirmDelete
          id={image.id}
          name="gallery image"
          action={deleteAction}
          label="Remove"
          size="sm"
          description="The image will be removed from this project. The uploaded file stays in the media library."
        />
      </div>
    </div>
  );
}
