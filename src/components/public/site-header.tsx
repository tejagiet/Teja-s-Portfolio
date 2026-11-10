"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, FileText, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { PUBLIC_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "glass border-border/80 shadow-[0_8px_30px_-24px_rgba(0,0,0,0.35)]"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Teja Manikanta — home">
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-foreground text-[11px] font-bold tracking-tight text-background">
            TM
            <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">Teja Manikanta</span>
            <span className="mt-1 hidden text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:block">
              Full-stack developer
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {PUBLIC_NAV.map((item) => {
            const active = item.href === "/projects" && pathname.startsWith("/projects");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground",
                  active && "bg-muted/70 text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/resume"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "hidden h-9 gap-1.5 rounded-full px-3.5 sm:inline-flex",
            })}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Resume
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/70 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border bg-card md:hidden"
          >
            <nav className="mx-auto flex w-full max-w-6xl flex-col px-5 py-4" aria-label="Mobile">
              {PUBLIC_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between border-b border-border/60 py-3 text-sm text-muted-foreground last:border-0 hover:text-foreground"
                >
                  {item.label}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ))}
              <Link
                href="/resume"
                className={buttonVariants({
                  variant: "primary",
                  size: "md",
                  className: "mt-4 w-full",
                })}
              >
                <FileText className="h-4 w-4" aria-hidden />
                View resume
              </Link>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
