"use client";

import { useMemo } from "react";
import type { CrimeCategory } from "@/lib/police-api";

const CATEGORY_COLORS: Record<string, string> = {
  "anti-social-behaviour": "#f97316",
  "bicycle-theft": "#eab308",
  burglary: "#dc2626",
  "criminal-damage-arson": "#b91c1c",
  drugs: "#7c3aed",
  "possession-of-weapons": "#9333ea",
  "public-order": "#0891b2",
  robbery: "#be123c",
  shoplifting: "#db2777",
  "theft-from-the-person": "#9d174d",
  "vehicle-crime": "#0284c7",
  "violent-crime": "#991b1b",
  "other-theft": "#64748b",
  other: "#475569",
};

export function colorFor(category: string): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  const palette = ["#0ea5e9", "#22c55e", "#a855f7", "#ec4899", "#f59e0b", "#14b8a6"];
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

export function categoryName(category: string, categories: CrimeCategory[]): string {
  return categories.find((c) => c.url === category)?.name ?? category;
}

type Props = {
  crimes: { category: string }[];
  categories: CrimeCategory[];
  filter: string;
  onFilterChange: (filter: string) => void;
  variant?: "bar" | "list";
};

export default function CategoryFilter({
  crimes,
  categories,
  filter,
  onFilterChange,
  variant = "bar",
}: Props) {
  const filterOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of crimes) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([url, count]) => ({
        url,
        name: categoryName(url, categories),
        count,
        color: colorFor(url),
      }));
  }, [crimes, categories]);

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => onFilterChange("all-crime")}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
            filter === "all-crime"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          <span>All</span>
          <span className="text-xs opacity-70">{crimes.length}</span>
        </button>
        {filterOptions.map(({ url, name, count, color }) => (
          <button
            key={url}
            onClick={() => onFilterChange(url)}
            className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${
              filter === url
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="truncate">{name}</span>
            </span>
            <span className="shrink-0 text-xs opacity-70">{count}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 p-3">
      <button
        onClick={() => onFilterChange("all-crime")}
        className={`rounded-full px-3 py-1 text-sm font-medium transition ${
          filter === "all-crime"
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        All ({crimes.length})
      </button>
      {filterOptions.map(({ url, name, count, color }) => (
        <button
          key={url}
          onClick={() => onFilterChange(url)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition ${
            filter === url
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {name} ({count})
        </button>
      ))}
    </div>
  );
}