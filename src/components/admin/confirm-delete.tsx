"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/validation";

export function ConfirmDelete({
  id,
  name,
  action,
  label = "Delete",
  description,
  redirectTo,
  size = "sm",
  className,
}: {
  id: string;
  name: string;
  action: (id: string) => Promise<ActionState>;
  label?: string;
  description?: string;
  redirectTo?: string;
  size?: "sm" | "md" | "icon";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const confirm = () => {
    startTransition(async () => {
      const result = await action(id);
      if (result.status === "success") {
        toast.success(result.message || `${name} deleted.`);
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      } else {
        toast.error(result.message || "The item could not be deleted.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-border text-muted-foreground transition-colors hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-600 dark:hover:text-red-400 ${
          size === "icon" ? "h-7 w-7" : "h-8 px-2.5 text-[11px]"
        } ${className || ""}`}
        aria-label={`Delete ${name}`}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        {size !== "icon" ? label : null}
      </button>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !pending && setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`delete-heading-${id}`}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <TriangleAlert className="h-4 w-4" aria-hidden />
              </div>
              <h2 id={`delete-heading-${id}`} className="mt-3 text-sm font-semibold">
                Delete {name}?
              </h2>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {description ||
                  "This action is permanent and cannot be undone. Related data may also be removed."}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={confirm} disabled={pending}>
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
