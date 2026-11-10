"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      closeButton
      richColors
      toastOptions={{
        style: {
          borderRadius: "0.75rem",
          fontSize: "0.8125rem",
        },
      }}
    />
  );
}
