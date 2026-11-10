"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

type Section = { key: string; title: string };

export function SectionOrderEditor({
  sections,
  initialOrder,
  initialHidden,
}: {
  sections: Section[];
  initialOrder: string[];
  initialHidden: string[];
}) {
  const [order, setOrder] = useState<string[]>(() => normalize(initialOrder, sections));
  const [hidden, setHidden] = useState<string[]>(initialHidden);

  useEffect(() => {
    setOrder(normalize(initialOrder, sections));
    setHidden(initialHidden);
  }, [initialOrder, initialHidden, sections]);

  const move = (index: number, direction: -1 | 1) => {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const byKey = new Map(sections.map((section) => [section.key, section]));

  return (
    <div>
      <input type="hidden" name="sectionOrder" value={order.join(",")} />
      <ul className="space-y-1.5">
        {order.map((key, index) => {
          const section = byKey.get(key);
          if (!section) return null;
          const isHidden = hidden.includes(key);
          return (
            <li
              key={key}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-2.5 py-1.5"
            >
              <input
                type="checkbox"
                name="hiddenSections"
                value={key}
                checked={isHidden}
                onChange={(event) =>
                  setHidden((current) =>
                    event.target.checked ? [...current, key] : current.filter((entry) => entry !== key),
                  )
                }
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                aria-label={`Hide ${section.title}`}
              />
              <span className={isHidden ? "flex-1 text-[11px] text-muted-foreground line-through" : "flex-1 text-[11px]"}>
                {section.title}
              </span>
              <span className="font-mono text-[9px] text-muted-foreground">{index + 1}</span>
              <span className="flex gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  aria-label={`Move ${section.title} up`}
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  aria-label={`Move ${section.title} down`}
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        Uncheck a section to hide it from this resume. Hidden sections stay in the content snapshot and can be
        restored later.
      </p>
    </div>
  );
}

function normalize(order: string[], sections: Section[]) {
  const keys = sections.map((section) => section.key);
  const normalized = order.filter((key) => keys.includes(key));
  for (const key of keys) {
    if (!normalized.includes(key)) normalized.push(key);
  }
  return normalized;
}
