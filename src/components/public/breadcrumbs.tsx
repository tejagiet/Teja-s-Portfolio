import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs({ items }: { items: Array<{ name: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        <li>
          <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
            <Home className="h-3 w-3" aria-hidden />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="inline-flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" aria-hidden />
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.name}
              </Link>
            ) : (
              <span className="text-foreground" aria-current="page">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
