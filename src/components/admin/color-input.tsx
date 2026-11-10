"use client";

import { useState } from "react";

import { Input } from "@/components/ui/form";

export function ColorInput({
  name = "accentColor",
  defaultValue = "#4f46e5",
  label = "Choose accent colour",
}: {
  name?: string;
  defaultValue?: string;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-card p-1"
        aria-label={label}
      />
      <Input
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        pattern="^#[0-9a-fA-F]{6}$"
        required
        maxLength={7}
        className="font-mono text-xs"
        aria-label={`${label} hex value`}
      />
    </div>
  );
}
