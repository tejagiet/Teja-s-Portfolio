"use client";

import { ImageIcon, Link2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { ImageCropUpload } from "@/components/admin/image-crop-upload";
import { Input, Label } from "@/components/ui/form";
import type { ActionState } from "@/lib/validation";

export function ImageField({
  name,
  label,
  value,
  uploadAction,
  folder = "media",
  aspect = 16 / 9,
  hint,
  maxDimension = 2000,
  onChange,
}: {
  name: string;
  label: string;
  value?: string | null;
  uploadAction: (formData: FormData) => Promise<ActionState>;
  folder?: string;
  aspect?: number;
  hint?: string;
  maxDimension?: number;
  onChange?: (url: string) => void;
}) {
  const [current, setCurrent] = useState(value || "");

  useEffect(() => setCurrent(value || ""), [value]);

  const update = (url: string) => {
    setCurrent(url);
    onChange?.(url);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label className="mb-0" htmlFor={`${name}-url`}>
          {label}
        </Label>
        <div className="flex items-center gap-1.5">
          <ImageCropUpload
            uploadAction={uploadAction}
            fields={{ folder }}
            aspect={aspect}
            maxDimension={maxDimension}
            label="Upload"
            variant="ghost"
            onUploaded={update}
          />
          {current ? (
            <button
              type="button"
              onClick={() => update("")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Remove ${label}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <input type="hidden" name={name} value={current} />

      <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/50">
        {current ? (
          <Image src={current} alt={label} fill sizes="640px" className="object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <ImageIcon className="h-6 w-6" aria-hidden />
            <span className="text-[10px]">Upload an image or paste a URL below</span>
          </div>
        )}
      </div>

      <div className="relative mt-2">
        <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={`${name}-url`}
          value={current}
          onChange={(event) => update(event.target.value)}
          placeholder="https://res.cloudinary.com/… or /api/media/…"
          className="h-9 pl-9 text-[11px]"
        />
      </div>
      {hint ? <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
