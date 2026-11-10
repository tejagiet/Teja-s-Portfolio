"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { setupAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/validation";

export function SetupForm({ tokenRequired }: { tokenRequired: boolean }) {
  const [state, formAction, pending] = useActionState(setupAction, initialActionState);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.status === "error") toast.error(state.message || "Setup failed.");
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[11px] leading-relaxed text-red-700 dark:text-red-300">
          {state.message}
        </div>
      ) : null}

      <Field label="Your name" htmlFor="setup-name" error={state.errors?.name}>
        <Input id="setup-name" name="name" autoComplete="name" placeholder="Teja Manikanta" required />
      </Field>

      <Field label="Email address" htmlFor="setup-email" error={state.errors?.email}>
        <Input
          id="setup-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field
        label="Password"
        htmlFor="setup-password"
        error={state.errors?.password}
        hint="At least 8 characters, with upper and lowercase letters and a number."
      >
        <div className="relative">
          <Input
            id="setup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
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

      <Field label="Confirm password" htmlFor="setup-confirm" error={state.errors?.confirm}>
        <Input
          id="setup-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      {tokenRequired ? (
        <Field
          label="Setup token"
          htmlFor="setup-token"
          error={state.errors?.token}
          hint="The value of ADMIN_SETUP_TOKEN from the server environment."
        >
          <Input id="setup-token" name="token" type="password" autoComplete="off" required />
        </Field>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <p>
            ADMIN_SETUP_TOKEN is not configured on this environment. Add it and restart the app to
            enable secure initialization.
          </p>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending || !tokenRequired}
        className="h-11 w-full rounded-xl"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldPlus className="h-4 w-4" aria-hidden />}
        {pending ? "Creating admin…" : "Create admin account"}
      </Button>

      <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
        Setup can only run while no admin account exists. Remove the setup token afterwards.
      </p>
    </form>
  );
}
