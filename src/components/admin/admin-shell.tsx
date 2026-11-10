"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  PanelLeftClose,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Icon } from "@/components/ui/icon";
import { logoutAction } from "@/lib/actions/auth";
import { cn, initials } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: string; badge?: number };
type NavGroup = { label: string; items: NavItem[] };

export function AdminShell({
  user,
  unreadMessages,
  children,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    profilePhotoUrl: string | null;
  };
  unreadMessages: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const groups: NavGroup[] = [
    {
      label: "Workspace",
      items: [
        { href: "/admin", label: "Overview", icon: "LayoutDashboard" },
        { href: "/admin/analytics", label: "Analytics", icon: "BarChart3" },
        { href: "/admin/messages", label: "Messages", icon: "Mail", badge: unreadMessages },
      ],
    },
    {
      label: "Content",
      items: [
        { href: "/admin/profile", label: "Profile", icon: "CircleUser" },
        { href: "/admin/projects", label: "Projects", icon: "FolderKanban" },
        { href: "/admin/skills", label: "Skills", icon: "Sparkles" },
        { href: "/admin/experience", label: "Experience", icon: "Briefcase" },
        { href: "/admin/education", label: "Education", icon: "GraduationCap" },
        { href: "/admin/certifications", label: "Certifications", icon: "BadgeCheck" },
        { href: "/admin/services", label: "Services", icon: "Layers" },
        { href: "/admin/achievements", label: "Achievements", icon: "Trophy" },
      ],
    },
    {
      label: "Publishing",
      items: [
        { href: "/admin/resume", label: "Resume builder", icon: "FileText" },
        { href: "/admin/seo", label: "SEO manager", icon: "Search" },
        { href: "/admin/media", label: "Media library", icon: "Images" },
      ],
    },
    {
      label: "System",
      items: [
        { href: "/admin/settings", label: "Website settings", icon: "Settings" },
        { href: "/admin/account", label: "Account", icon: "User" },
        { href: "/admin/activity", label: "Activity logs", icon: "History" },
      ],
    },
  ];

  const allItems = groups.flatMap((group) => group.items);
  const current =
    allItems
      .filter((item) =>
        item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href),
      )
      .sort((a, b) => b.href.length - a.href.length)[0] ?? allItems[0];

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const avatar = user.image || user.profilePhotoUrl;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-foreground text-[11px] font-bold text-background">
            TM
            <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">Admin</span>
            <span className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Portfolio CMS
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {groups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                        active
                          ? "bg-accent-soft text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon
                        name={item.icon}
                        className={cn(
                          "h-3.5 w-3.5",
                          active ? "text-accent" : "text-muted-foreground/80",
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-accent-foreground">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      ) : null}
                      {active ? <span className="h-1 w-1 rounded-full bg-accent" /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="Globe" className="h-3.5 w-3.5" />
          View public site
          <ExternalLink className="ml-auto h-3 w-3" />
        </Link>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] text-muted-foreground">CMS connected</span>
          <span className="ml-auto font-mono text-[9px] text-muted-foreground/60">v1.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-card lg:block">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 items-center gap-2 text-xs">
            <span className="hidden text-muted-foreground sm:inline">Admin</span>
            <span className="hidden text-muted-foreground/40 sm:inline">/</span>
            <span className="truncate font-medium">{current?.label || "Overview"}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
              View site
            </Link>
            <ThemeToggle />
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-2 transition-colors hover:bg-muted"
              >
                {avatar ? (
                  <span className="relative h-7 w-7 overflow-hidden rounded-full bg-muted">
                    <Image src={avatar} alt={user.name} fill sizes="28px" className="object-cover" />
                  </span>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-foreground">
                    {initials(user.name)}
                  </span>
                )}
                <span className="hidden max-w-24 truncate text-[11px] font-medium sm:block">
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
              </button>

              <AnimatePresence>
                {menuOpen ? (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
                  >
                    <div className="border-b border-border p-3">
                      <div className="flex items-center gap-2.5">
                        {avatar ? (
                          <span className="relative h-9 w-9 overflow-hidden rounded-full bg-muted">
                            <Image src={avatar} alt={user.name} fill sizes="36px" className="object-cover" />
                          </span>
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold">
                            {initials(user.name)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">{user.name}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/admin/account"
                        role="menuitem"
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Icon name="User" className="h-3.5 w-3.5" />
                        Account settings
                      </Link>
                      <Link
                        href="/admin/profile"
                        role="menuitem"
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Icon name="CircleUser" className="h-3.5 w-3.5" />
                        Public profile
                      </Link>
                    </div>
                    <form action={logoutAction} className="border-t border-border p-1">
                      <button
                        type="submit"
                        role="menuitem"
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                      </button>
                    </form>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[90rem] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
