"use client";

import { useEffect, useMemo, useState } from "react";
import { getCrimeTrend, type Crime } from "@/lib/police-api";
import { categoryName, colorFor } from "@/components/CategoryFilter";
import type { CrimeCategory } from "@/lib/police-api";

type Props = {
  lat: number;
  lng: number;
  dates: string[];
  categories: CrimeCategory[];
};

type TrendPoint = { date: string; crimes: Crime[] };

export default function TrendChart({ lat, lng, dates, categories }: Props) {
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all-crime");
  const datesKey = dates.join(",");

  useEffect(() => {
    let cancelled = false;
    getCrimeTrend(lat, lng, dates)
      .then((result) => {
        if (!cancelled) setTrend(result);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load trend.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, datesKey, dates]);

  const series = useMemo(() => {
    if (!trend) return [];
    const isAll = selectedCategory === "all-crime";
    return trend.map((point) => ({
      date: point.date,
      count: isAll
        ? point.crimes.length
        : point.crimes.filter((c) => c.category === selectedCategory).length,
    }));
  }, [trend, selectedCategory]);

  const categoryOptions = useMemo(() => {
    if (!trend) return [];
    const counts = new Map<string, number>();
    for (const point of trend) {
      for (const c of point.crimes) {
        counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([url, count]) => ({
        url,
        name: categoryName(url, categories),
        count,
        color: colorFor(url),
      }));
  }, [trend, categories]);

  const stats = useMemo(() => {
    if (series.length === 0) return null;
    const counts = series.map((s) => s.count);
    const total = counts.reduce((a, b) => a + b, 0);
    const avg = total / series.length;
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    const latest = counts[counts.length - 1] ?? 0;
    const first = counts[0] ?? 0;
    const change = first > 0 ? ((latest - first) / first) * 100 : 0;
    return { total, avg, max, min, latest, first, change };
  }, [series]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Crime trend
        </p>
        <span className="text-xs text-zinc-400">{dates.length} months</span>
      </div>

      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-white"
      >
        <option value="all-crime">All crime and ASB</option>
        {categoryOptions.map(({ url, name, count }) => (
          <option key={url} value={url}>
            {name} ({count})
          </option>
        ))}
      </select>

      {loading && <p className="py-6 text-center text-sm text-zinc-500">Loading trend...</p>}
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && stats && <TrendBars series={series} stats={stats} />}
    </div>
  );
}

function TrendBars({
  series,
  stats,
}: {
  series: { date: string; count: number }[];
  stats: { total: number; avg: number; max: number; min: number; latest: number; first: number; change: number };
}) {
  const width = 320;
  const height = 120;
  const padding = { top: 8, right: 4, bottom: 18, left: 22 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxVal = Math.max(stats.max, 1);
  const barGap = 2;
  const barWidth = (innerW - barGap * (series.length - 1)) / series.length;
  const avgY = padding.top + innerH - (stats.avg / maxVal) * innerH;
  const changePositive = stats.change >= 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-zinc-100 px-2 py-1.5 dark:bg-zinc-900">
          <p className="text-zinc-500">Total</p>
          <p className="font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-md bg-zinc-100 px-2 py-1.5 dark:bg-zinc-900">
          <p className="text-zinc-500">Avg / month</p>
          <p className="font-semibold">{stats.avg.toFixed(1)}</p>
        </div>
        <div className="rounded-md bg-zinc-100 px-2 py-1.5 dark:bg-zinc-900">
          <p className="text-zinc-500">Change</p>
          <p className={`font-semibold ${changePositive ? "text-red-600" : "text-green-600"}`}>
            {changePositive ? "+" : ""}
            {stats.change.toFixed(0)}%
          </p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={avgY}
          y2={avgY}
          stroke="#a1a1aa"
          strokeDasharray="3 3"
          strokeWidth="0.8"
        />
        {series.map((point, i) => {
          const h = (point.count / maxVal) * innerH;
          const x = padding.left + i * (barWidth + barGap);
          const y = padding.top + innerH - h;
          return (
            <g key={point.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx={1}
                className="fill-zinc-900 dark:fill-white"
              >
                <title>{point.date}: {point.count} crimes</title>
              </rect>
              {i === 0 || i === series.length - 1 || i === Math.floor(series.length / 2) ? (
                <text
                  x={x + barWidth / 2}
                  y={height - 4}
                  textAnchor="middle"
                  className="fill-zinc-500 text-[7px]"
                >
                  {point.date.slice(2)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 bg-zinc-900 dark:bg-white" /> Monthly crimes
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-zinc-400" /> Average
        </span>
      </div>
    </div>
  );
}