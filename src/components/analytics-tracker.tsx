"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Sends real page-view events to the first-party analytics endpoint.
 * No fake data is generated; the dashboard simply aggregates what is collected.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const payload = JSON.stringify({
      type: "PAGE_VIEW",
      path: pathname,
      referrer: document.referrer || null,
    });

    const timer = window.setTimeout(() => {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics", blob);
      } else {
        void fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
