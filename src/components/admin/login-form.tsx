"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { loginAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/validation";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialActionState);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.status === "error") toast.error(state.message || "Sign in failed.");
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {state.status === "error" ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[11px] leading-relaxed text-red-700 dark:text-red-300">
          {state.message}
        </div>
      ) : null}

      <Field label="Email address" htmlFor="login-email" error={state.errors?.email}>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="admin@example.com"
          required
          autoFocus
        />
      </Field>

      <Field label="Password" htmlFor="login-password" error={state.errors?.password}>
        <div className="relative">
          <Input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </Field>

      <Button type="submit" disabled={pending} className="h-11 w-full rounded-xl">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
        {pending ? "Signing in…" : "Sign in to dashboard"}
      </Button>

      <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
        Sessions expire after 8 hours. Repeated failed attempts are rate limited.
      </p>
    </form>
  );
}
