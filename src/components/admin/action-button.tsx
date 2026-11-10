"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/validation";

export function ActionButton({
  action,
  label,
  icon,
  children,
  variant = "outline",
  size = "sm",
  className,
}: {
  action: () => Promise<ActionState>;
  label: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "soft";
  size?: "sm" | "md" | "icon";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = () => {
    startTransition(async () => {
      const result = await action();
      if (result.status === "success") {
        toast.success(result.message || "Done.");
        router.refresh();
      } else {
        toast.error(result.message || "The action could not be completed.");
      }
    });
  };

  const renderIcon = () => {
    if (pending) return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    if (children) return children;
    if (icon) {
      if (typeof icon === "function") {
        const IconComp = icon as React.ComponentType<{ className?: string }>;
        return <IconComp className="h-3.5 w-3.5" />;
      }
      return icon;
    }
    return null;
  };

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={run} disabled={pending}>
      {renderIcon()}
      {size !== "icon" ? label : null}
    </Button>
  );
}
