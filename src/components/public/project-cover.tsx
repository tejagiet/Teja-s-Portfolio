import Image from "next/image";

import { PROJECT_STATUS } from "@/lib/constants";
import type { ProjectStatus } from "@prisma/client";
import { cn, initials } from "@/lib/utils";

const palettes = [
  "from-indigo-500/25 via-violet-500/15 to-transparent",
  "from-teal-500/25 via-emerald-500/15 to-transparent",
  "from-amber-500/25 via-orange-500/15 to-transparent",
  "from-sky-500/25 via-blue-500/15 to-transparent",
  "from-rose-500/25 via-pink-500/15 to-transparent",
  "from-lime-500/25 via-green-500/15 to-transparent",
];

export function ProjectCover({
  title,
  category,
  status,
  imageUrl,
  alt,
  priority = false,
  className,
}: {
  title: string;
  category?: string;
  status?: ProjectStatus;
  imageUrl?: string | null;
  alt?: string | null;
  priority?: boolean;
  className?: string;
}) {
  const index = Array.from(title).reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length;

  return (
    <div className={cn("relative aspect-[16/10] w-full overflow-hidden bg-muted", className)}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt || `${title} cover image`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
          quality={95}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", palettes[index])}>
          <div className="absolute inset-0 grid-pattern opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="select-none text-[72px] font-semibold tracking-[-0.06em] text-foreground/[0.07]">
              {initials(title)}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
            <span className="rounded-md bg-background/70 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground backdrop-blur">
              {category || "Project"}
            </span>
            {status ? (
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[9px] font-medium uppercase tracking-wide ring-1 ring-inset backdrop-blur",
                  PROJECT_STATUS[status].tone,
                )}
              >
                {PROJECT_STATUS[status].label}
              </span>
            ) : null}
          </div>
        </div>
      )}
      {imageUrl && status ? (
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2 py-1 text-[9px] font-medium uppercase tracking-wide ring-1 ring-inset backdrop-blur",
            PROJECT_STATUS[status].tone,
          )}
        >
          {PROJECT_STATUS[status].label}
        </span>
      ) : null}
    </div>
  );
}
