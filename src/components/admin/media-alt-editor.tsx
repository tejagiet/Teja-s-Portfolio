"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import type { ActionState } from "@/lib/validation";

export function MediaAltEditor({
  id,
  altText,
  action,
}: {
  id: string;
  altText: string | null;
  action: (id: string, altText: string) => Promise<ActionState>;
}) {
  const [value, setValue] = useState(altText || "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = () => {
    startTransition(async () => {
      const result = await action(id, value);
      if (result.status === "success") {
        toast.success(result.message || "Alt text updated.");
        router.refresh();
      } else {
        toast.error(result.message || "Alt text could not be updated.");
      }
    });
  };

  return (
    <div className="flex gap-1.5">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Add alt text"
        className="h-8 text-[11px]"
        maxLength={300}
        aria-label="Alt text"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={save}
        disabled={pending || value.trim() === (altText || "")}
        aria-label="Save alt text"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
