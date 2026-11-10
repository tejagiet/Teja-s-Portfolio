"use client";

import { Gauge, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Result = {
  strategy: string;
  scores: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  metrics: Array<[string, string]>;
};

function scoreTone(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function PageSpeedChecker({
  action,
}: {
  action: (strategy: "mobile" | "desktop") => Promise<ActionState>;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [strategy, setStrategy] = useState<"mobile" | "desktop" | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (next: "mobile" | "desktop") => {
    setStrategy(next);
    startTransition(async () => {
      const response = await action(next);
      if (response.status === "success" && response.data) {
        setResult(response.data as unknown as Result);
        toast.success(response.message || "PageSpeed Insights finished.");
      } else {
        toast.error(response.message || "PageSpeed Insights could not run.");
      }
    });
  };

  const scores = result
    ? [
        { label: "Performance", value: result.scores.performance },
        { label: "Accessibility", value: result.scores.accessibility },
        { label: "Best practices", value: result.scores.bestPractices },
        { label: "SEO", value: result.scores.seo },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => run("mobile")} disabled={pending}>
          {pending && strategy === "mobile" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Gauge className="h-3.5 w-3.5" />
          )}
          Test mobile
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => run("desktop")} disabled={pending}>
          {pending && strategy === "desktop" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Gauge className="h-3.5 w-3.5" />
          )}
          Test desktop
        </Button>
        <span className="text-[10px] text-muted-foreground">
          Runs a real Lighthouse analysis against the configured public site URL.
        </span>
      </div>

      {result ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {scores.map((score) => (
              <div key={score.label} className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  {score.label}
                </p>
                <p className={cn("mt-1 text-xl font-semibold tabular-nums", scoreTone(score.value))}>
                  {score.value === null ? "—" : score.value}
                </p>
              </div>
            ))}
          </div>
          {result.metrics.length ? (
            <dl className="grid gap-1.5 text-[11px] sm:grid-cols-2">
              {result.metrics.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 rounded-lg bg-muted/40 px-2.5 py-1.5">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="text-[10px] text-muted-foreground">
            {result.strategy === "mobile" ? "Mobile" : "Desktop"} Lighthouse result. Scores are provided by Google
            PageSpeed Insights and are not stored.
          </p>
        </div>
      ) : null}
    </div>
  );
}
