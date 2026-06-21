"use client";

import { useMemo } from "react";
import type { Crime } from "@/lib/police-api";

type Props = {
  crimes: Crime[];
};

const OUTCOME_COLORS: Record<string, string> = {
  "Under investigation": "#0891b2",
  "Unable to prosecute suspect": "#dc2626",
  "Investigation complete; no suspect identified": "#64748b",
  "Status update unavailable": "#a1a1aa",
  "Further investigation is not in the public interest": "#7c3aed",
  "Suspect charged": "#16a34a",
  "Offender sent to prison": "#991b1b",
  "Awaiting court outcome": "#f59e0b",
  "Court case unable to proceed": "#ea580c",
  "Local resolution": "#0284c7",
  "Offender given a caution": "#14b8a6",
  "Offender given a drugs possession warning": "#22c55e",
  "Offender given a penalty notice": "#65a30d",
  "Offender given community sentence": "#0d9488",
  "Offender given suspended prison sentence": "#9333ea",
  "Offender given conditional discharge": "#a855f7",
  "Offender given absolute discharge": "#c084fc",
  "Offender fined": "#db2777",
  "Offender ordered to pay compensation": "#e11d48",
  "Offender deprived of property": "#f43f5e",
  "Offender otherwise dealt with": "#78716c",
  "Defendant found not guilty": "#10b981",
  "Defendant sent to Crown Court": "#6366f1",
  "Suspect charged as part of another case": "#3b82f6",
  "Formal action is not in the public interest": "#8b5cf6",
  "Action to be taken by another organisation": "#06b6d4",
  "Further action is not in the public interest": "#9333ea",
  "Court result unavailable": "#fbbf24",
};

function colorForOutcome(name: string): string {
  if (OUTCOME_COLORS[name]) return OUTCOME_COLORS[name];
  const palette = ["#0ea5e9", "#22c55e", "#a855f7", "#ec4899", "#f59e0b", "#14b8a6"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

export default function OutcomeBreakdown({ crimes }: Props) {
  const { entries, total, withOutcome, noOutcome } = useMemo(() => {
    const counts = new Map<string, number>();
    let withOutcome = 0;
    let noOutcome = 0;
    for (const c of crimes) {
      if (c.outcome_status) {
        withOutcome++;
        const cat = c.outcome_status.category;
        counts.set(cat, (counts.get(cat) ?? 0) + 1);
      } else {
        noOutcome++;
      }
    }
    const entries = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        pct: withOutcome > 0 ? (count / withOutcome) * 100 : 0,
        color: colorForOutcome(name),
      }));
    return { entries, total: crimes.length, withOutcome, noOutcome };
  }, [crimes]);

  if (crimes.length === 0) {
    return <p className="text-sm text-zinc-500">No crime data loaded.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-zinc-100 px-2 py-1.5 dark:bg-zinc-900">
          <p className="text-zinc-500">Total</p>
          <p className="font-semibold">{total}</p>
        </div>
        <div className="rounded-md bg-zinc-100 px-2 py-1.5 dark:bg-zinc-900">
          <p className="text-zinc-500">With</p>
          <p className="font-semibold">{withOutcome}</p>
        </div>
        <div className="rounded-md bg-zinc-100 px-2 py-1.5 dark:bg-zinc-900">
          <p className="text-zinc-500">None</p>
          <p className="font-semibold">{noOutcome}</p>
        </div>
      </div>

      {withOutcome === 0 ? (
        <p className="text-sm text-zinc-500">
          No outcomes recorded for this area. Anti-social behaviour incidents do not have
          outcomes.
        </p>
      ) : (
        <>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full">
            {entries.map((e) => (
              <div
                key={e.name}
                style={{ width: `${e.pct}%`, backgroundColor: e.color }}
                title={`${e.name}: ${e.pct.toFixed(1)}%`}
              />
            ))}
          </div>

          <ul className="flex flex-col gap-1.5">
            {entries.map((e) => (
              <li key={e.name} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: e.color }}
                />
                <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-300">
                  {e.name}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {e.count}
                </span>
                <span className="shrink-0 w-12 text-right tabular-nums text-zinc-500">
                  {e.pct.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}