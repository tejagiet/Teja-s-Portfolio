"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
          <CircleAlert className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="mt-4 text-base font-semibold">Something went wrong in this module</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          The request could not be completed. This can happen after a database connection drop or a temporary
          service failure. Try again, or return to the overview.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[9px] text-muted-foreground/70">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button type="button" onClick={reset} size="sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
          <Link
            href="/admin"
            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to overview
          </Link>
        </div>
      </div>
    </div>
  );
}
