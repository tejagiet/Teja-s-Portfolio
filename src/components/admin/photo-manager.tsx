"use client";

import { ImageIcon, Images, Loader2, RotateCcw, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { ImageCropUpload } from "@/components/admin/image-crop-upload";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import { Button } from "@/components/ui/button";
import { selectExistingProfilePhotoAction } from "@/lib/actions/media";
import type { ActionState } from "@/lib/validation";

export function PhotoManager({
  kind,
  currentUrl,
  previousUrl,
  title,
  description,
  aspect = 1,
  cropShape = "rect",
  previewClassName,
  uploadAction,
  removeAction,
  restoreAction,
}: {
  kind: "profile" | "about" | "avatar";
  currentUrl: string | null;
  previousUrl: string | null;
  title: string;
  description: string;
  aspect?: number;
  cropShape?: "rect" | "round";
  previewClassName?: string;
  uploadAction: (formData: FormData) => Promise<ActionState>;
  removeAction: (formData: FormData) => Promise<ActionState>;
  restoreAction: (formData: FormData) => Promise<ActionState>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(currentUrl);
  const [previous, setPrevious] = useState(previousUrl);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => setCurrent(currentUrl), [currentUrl]);
  useEffect(() => setPrevious(previousUrl), [previousUrl]);

  const runKindAction = (action: (formData: FormData) => Promise<ActionState>, success: () => void) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("kind", kind);
      const result = await action(formData);
      if (result.status === "success") {
        success();
        toast.success(result.message || "Photo updated.");
        router.refresh();
      } else {
        toast.error(result.message || "The photo could not be updated.");
      }
    });
  };

  const handleSelectFromLibrary = (url: string) => {
    startTransition(async () => {
      const result = await selectExistingProfilePhotoAction(kind, url);
      if (result.status === "success") {
        setPrevious(current);
        setCurrent(url);
        toast.success(result.message || "Photo updated from media library.");
        router.refresh();
      } else {
        toast.error(result.message || "The photo could not be updated.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3">
        <h3 className="text-xs font-semibold">{title}</h3>
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <div
        className={
          previewClassName ||
          "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted"
        }
      >
        {current ? (
          <Image
            src={current}
            alt={title}
            fill
            sizes="640px"
            quality={95}
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-7 w-7" aria-hidden />
            <span className="text-[10px]">No image yet</span>
          </div>
        )}
        {pending ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ImageCropUpload
          uploadAction={uploadAction}
          fields={{ kind }}
          aspect={aspect}
          cropShape={cropShape}
          label={current ? "Replace" : "Upload photo"}
          variant="outline"
          onUploaded={(url) => {
            setPrevious(current);
            setCurrent(url);
          }}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setShowLibrary(true)}
          title="Pick an existing photo from the media library"
        >
          <Images className="h-3.5 w-3.5" />
          Media library
        </Button>

        {current ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              runKindAction(removeAction, () => {
                setPrevious(current);
                setCurrent(null);
              })
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}

        {previous ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              runKindAction(restoreAction, () => {
                setCurrent(previous);
                setPrevious(current);
              })
            }
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore previous
          </Button>
        ) : null}
      </div>

      {previous ? (
        <p className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="relative h-6 w-6 overflow-hidden rounded border border-border">
            <Image
              src={previous}
              alt="Previous photo"
              fill
              sizes="48px"
              quality={90}
              className="object-cover"
            />
          </span>
          A previous image is available to restore.
        </p>
      ) : null}

      <MediaPickerModal
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={handleSelectFromLibrary}
        title={`Choose ${title} from Media Library`}
        currentUrl={current}
      />
    </div>
  );
}
