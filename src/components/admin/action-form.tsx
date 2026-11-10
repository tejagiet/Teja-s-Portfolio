"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { initialActionState, type ActionState } from "@/lib/validation";

type ActionFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  id?: string;
  submitLabel?: string;
  pendingLabel?: string;
  successMessage?: string;
  resetOnSuccess?: boolean;
  secondaryAction?: ReactNode;
  className?: string;
  footerClassName?: string;
};

export function ActionForm({
  action,
  children,
  id,
  submitLabel = "Save changes",
  pendingLabel = "Saving…",
  successMessage,
  resetOnSuccess = false,
  secondaryAction,
  className,
  footerClassName,
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message || successMessage || "Saved.");
      if (resetOnSuccess) formRef.current?.reset();
      const redirectTo = state.data?.redirectTo;
      if (typeof redirectTo === "string" && redirectTo.startsWith("/")) {
        router.push(redirectTo);
      }
      router.refresh();
    } else if (state.status === "error") {
      toast.error(state.message || "The changes could not be saved.");
    }
    // Only react to a new action result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fieldErrors = state.errors ? Object.entries(state.errors) : [];

  return (
    <form ref={formRef} id={id} action={formAction} className={className}>
      {state.status === "error" ? (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[11px] leading-relaxed text-red-700 dark:text-red-300">
          <p className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden />
            {state.message || "Please review the form."}
          </p>
          {fieldErrors.length ? (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
              {fieldErrors.map(([field, messages]) => (
                <li key={field}>
                  <span className="font-medium">{field}</span>: {messages[0]}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className="mb-4 flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          {state.message || successMessage || "Saved."}
        </div>
      ) : null}

      {children}

      <div className={footerClassName || "mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4"}>
        {secondaryAction}
        <Button type="submit" disabled={pending} size="sm">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Save className="h-3.5 w-3.5" aria-hidden />}
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
