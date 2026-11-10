"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Folder, ImageIcon, Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { getMediaAssetsAction } from "@/lib/actions/media";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

type MediaItem = {
  id: string;
  url: string;
  secureUrl: string;
  altText: string | null;
  folder: string;
  width: number | null;
  height: number | null;
  format: string | null;
  createdAt: string;
};

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  title = "Choose from Media Library",
  currentUrl,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  currentUrl?: string | null;
}) {
  const [assets, setAssets] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");

  useEffect(() => {
    if (open) {
      setLoading(true);
      getMediaAssetsAction()
        .then((items) => setAssets(items))
        .catch((err) => console.error("[media-picker]", err))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const folders = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => a.folder && set.add(a.folder));
    return ["all", ...Array.from(set)];
  }, [assets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      const matchFolder = selectedFolder === "all" || a.folder === selectedFolder;
      if (!matchFolder) return false;
      if (!q) return true;
      const target = `${a.altText || ""} ${a.folder || ""} ${a.secureUrl || ""}`.toLowerCase();
      return target.includes(q);
    });
  }, [assets, search, selectedFolder]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div>
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Select an existing high-quality image from your Cloudinary media assets to reuse it here.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-3">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by alt text, folder or URL…"
                className="h-8 pl-8 text-[11px]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              {folders.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedFolder(f)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    selectedFolder === f
                      ? "bg-accent text-accent-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "All folders" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Grid */}
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs">Loading media assets…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8 opacity-40" />
                <p className="text-xs">No media assets found matching your filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filtered.map((item) => {
                  const targetUrl = item.secureUrl || item.url;
                  const isSelected = currentUrl === targetUrl;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelect(targetUrl);
                        onClose();
                      }}
                      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-accent ring-2 ring-accent shadow-md"
                          : "border-border hover:border-accent/60 hover:shadow-sm"
                      }`}
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-muted">
                        <Image
                          src={targetUrl}
                          alt={item.altText || "Media asset"}
                          fill
                          sizes="(max-width: 768px) 50vw, 220px"
                          quality={90}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {isSelected ? (
                          <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground shadow">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-0.5 bg-card p-2 text-[10px]">
                        <span className="truncate font-medium text-foreground">
                          {item.altText || targetUrl.split("/").pop() || "Image"}
                        </span>
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Folder className="h-2.5 w-2.5" />
                            {item.folder}
                          </span>
                          {item.width && item.height ? (
                            <span>{item.width}×{item.height}</span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
            <span>
              {filtered.length} image{filtered.length === 1 ? "" : "s"} available
            </span>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
