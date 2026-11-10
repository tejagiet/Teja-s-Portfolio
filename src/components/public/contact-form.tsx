"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { submitContactMessage } from "@/lib/actions/contact";
import { initialActionState } from "@/lib/validation";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactMessage, initialActionState);
  const [startedAt, setStartedAt] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setStartedAt(String(Date.now()));
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state.status === "error") {
      toast.error(state.message || "The message could not be sent.");
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate={false}>
      <input type="hidden" name="website" value="" tabIndex={-1} autoComplete="off" aria-hidden />
      <input type="hidden" name="startedAt" value={startedAt} />

      {state.status === "success" ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <p>{state.message}</p>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[11px] leading-relaxed text-red-700 dark:text-red-300">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="contact-name" error={state.errors?.name}>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            required
            maxLength={100}
          />
        </Field>
        <Field label="Email" htmlFor="contact-email" error={state.errors?.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={200}
          />
        </Field>
      </div>

      <Field label="Subject" htmlFor="contact-subject" error={state.errors?.subject}>
        <Input
          id="contact-subject"
          name="subject"
          placeholder="What would you like to discuss?"
          required
          maxLength={160}
        />
      </Field>

      <Field
        label="Message"
        htmlFor="contact-message"
        error={state.errors?.message}
        hint="Messages are stored securely and are never published publicly."
      >
        <Textarea
          id="contact-message"
          name="message"
          placeholder="Tell me a little about your idea, question or opportunity."
          required
          maxLength={6000}
          className="min-h-36"
        />
      </Field>

      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="max-w-[14rem] text-[10px] leading-relaxed text-muted-foreground">
          By sending a message you agree to be contacted about this enquiry.
        </p>
        <Button type="submit" disabled={pending} className="rounded-full px-5">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Send className="h-3.5 w-3.5" aria-hidden />}
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
