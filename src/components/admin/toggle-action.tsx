"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function ToggleAction({
  id,
  checked,
  action,
  label,
  className,
}: {
  id: string;
  checked: boolean;
  action: (id: string) => Promise<ActionState>;
  label: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(checked);
  const router = useRouter();

  const onToggle = () => {
    startTransition(async () => {
      const result = await action(id);
      if (result.status === "success") {
        setValue((current) => !current);
        toast.success(result.message || "Updated.");
        router.refresh();
      } else {
        toast.error(result.message || "Could not update the status.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      aria-label={label}
      aria-pressed={value}
      title={label}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
        value ? "border-accent bg-accent" : "border-border bg-muted",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform",
          value ? "translate-x-[18px]" : "translate-x-[2px]",
        )}
      />
      {pending ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-2.5 w-2.5 animate-spin text-white" />
        </span>
      ) : null}
    </button>
  );
}
