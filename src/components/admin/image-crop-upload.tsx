"use client";

import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ImagePlus, Loader2, RotateCw, Sparkles, X, ZoomIn, ZoomOut } from "lucide-react";
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
    // Try high-quality WebP first, fallback to high-quality JPEG
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          canvas.toBlob(
            (fallbackBlob) =>
              fallbackBlob ? resolve(fallbackBlob) : reject(new Error("The crop could not be created.")),
            "image/jpeg",
            0.98,
          );
        }
      },
      "image/webp",
      0.98,
    );
  });
}

export function ImageCropUpload({
  uploadAction,
  fields,
  aspect,
  cropShape = "rect",
  maxDimension = 4096,
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
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(aspect);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [pending, setPending] = useState(false);

  const reset = () => {
    setSource(null);
    setRawFile(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setArea(null);
    setSelectedAspect(aspect);
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Images must be 25 MB or smaller.");
      return;
    }
    setRawFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setArea(null);
      setSelectedAspect(aspect);
      setSource(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => toast.error("The image could not be read.");
    reader.readAsDataURL(file);
  };

  const uploadBlob = async (blob: Blob, filename = "upload.webp") => {
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("file", new File([blob], filename, { type: blob.type || "image/webp" }));
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

      toast.success(result.message || "High-quality image uploaded.");
      onUploaded(url);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setPending(false);
    }
  };

  const confirmCrop = async () => {
    if (!source || !area) return;
    try {
      const blob = await cropToBlob(source, area, maxDimension);
      await uploadBlob(blob, "crop.webp");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cropping failed.");
    }
  };

  const confirmOriginal = async () => {
    if (!rawFile) return;
    await uploadBlob(rawFile, rawFile.name || "original.webp");
  };

  const ASPECT_PRESETS: { label: string; value: number | undefined }[] = [
    { label: "Freeform", value: undefined },
    { label: "1:1 Square", value: 1 },
    { label: "4:5 Portrait", value: 4 / 5 },
    { label: "16:9 Cover", value: 16 / 9 },
    { label: "4:3 Standard", value: 4 / 3 },
  ];

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
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5">
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
              aria-label="Image Cropper"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div>
                  <h2 className="text-sm font-semibold">Adjust & Crop Image</h2>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Uploads in Ultra-HD (up to 4096px). Select a ratio or use the original uncropped image.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !pending && reset()}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Aspect Ratio Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-muted/20 px-5 py-2">
                <span className="text-[10px] font-medium text-muted-foreground">Aspect Ratio:</span>
                {ASPECT_PRESETS.map((p) => {
                  const isActive = selectedAspect === p.value;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setSelectedAspect(p.value)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors ${
                        isActive
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Cropper Viewport */}
              <div className="relative h-[min(54vh,24rem)] w-full bg-neutral-950">
                <Cropper
                  image={source}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={selectedAspect}
                  cropShape={cropShape}
                  showGrid
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setArea(pixels)}
                  style={{
                    cropAreaStyle: {
                      border: "2px solid rgba(255,255,255,0.9)",
                      boxShadow: "0 0 0 9999em rgba(0,0,0,0.6)",
                    },
                  }}
                />
              </div>

              {/* Zoom & Rotation Controls */}
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

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    onClick={confirmOriginal}
                    disabled={pending || !rawFile}
                    title="Upload full original image without cropping"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    Use Original (No Crop)
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={reset} disabled={pending}>
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={confirmCrop} disabled={pending || !area}>
                      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      {pending ? "Uploading…" : "Crop & Upload"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
