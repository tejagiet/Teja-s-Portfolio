"use client";

import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ImagePlus, Loader2, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/validation";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be read."));
    image.src = src;
  });
}

async function cropToBlob(src: string, area: Area, maxDimension: number) {
  const image = await loadImage(src);
  const scale = Math.min(1, maxDimension / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not crop this image.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The crop could not be created."))),
      "image/jpeg",
      0.92,
    );
  });
}

export function ImageCropUpload({
  uploadAction,
  fields,
  aspect = 1,
  cropShape = "rect",
  maxDimension = 1800,
  label = "Upload image",
  className,
  variant = "outline",
  disabled = false,
  onUploaded,
}: {
  uploadAction: (formData: FormData) => Promise<ActionState>;
  fields?: Record<string, string>;
  aspect?: number;
  cropShape?: "rect" | "round";
  maxDimension?: number;
  label?: string;
  className?: string;
  variant?: "primary" | "outline" | "soft" | "ghost";
  disabled?: boolean;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [pending, setPending] = useState(false);

  const reset = () => {
    setSource(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setArea(null);
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Images must be 8 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setArea(null);
      setSource(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => toast.error("The image could not be read.");
    reader.readAsDataURL(file);
  };

  const confirm = async () => {
    if (!source || !area) return;
    setPending(true);
    try {
      const blob = await cropToBlob(source, area, maxDimension);
      const formData = new FormData();
      formData.set("file", new File([blob], "upload.jpg", { type: "image/jpeg" }));
      for (const [key, value] of Object.entries(fields ?? {})) formData.set(key, value);

      const result = await uploadAction(formData);
      if (result.status !== "success") {
        toast.error(result.message || "The upload failed.");
        return;
      }

      const asset = result.data?.asset as { secureUrl?: string } | undefined;
      const url =
        (typeof result.data?.url === "string" ? result.data.url : null) || asset?.secureUrl;
      if (!url) {
        toast.error("The upload succeeded but no image URL was returned.");
        return;
      }

      toast.success(result.message || "Image uploaded.");
      onUploaded(url);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="sr-only"
        disabled={disabled || pending}
        onChange={(event) => {
          pickFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant={variant}
        size="sm"
        className={className}
        disabled={disabled || pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
        {pending ? "Uploading…" : label}
      </Button>

      <AnimatePresence>
        {source ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !pending && reset()}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Crop image"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold">Crop your image</h2>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Drag to reposition, scroll or pinch to zoom. The final image is optimized to WebP on the server.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !pending && reset()}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close cropper"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative h-[min(58vh,26rem)] w-full bg-neutral-950">
                <Cropper
                  image={source}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspect}
                  cropShape={cropShape}
                  showGrid
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setArea(pixels)}
                  style={{
                    cropAreaStyle: {
                      border: "2px solid rgba(255,255,255,0.9)",
                      boxShadow: "0 0 0 9999em rgba(0,0,0,0.55)",
                    },
                  }}
                />
              </div>

              <div className="space-y-3 border-t border-border p-4">
                <div className="flex items-center gap-3">
                  <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="h-1.5 w-full cursor-pointer accent-[var(--accent)]"
                    aria-label="Zoom"
                  />
                  <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <button
                    type="button"
                    onClick={() => setRotation((value) => (value + 90) % 360)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Rotate 90 degrees"
                    title="Rotate 90 degrees"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={reset} disabled={pending}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={confirm} disabled={pending || !area}>
                    {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {pending ? "Uploading…" : "Crop & upload"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
