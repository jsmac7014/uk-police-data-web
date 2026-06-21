"use client";

import { useEffect, useState } from "react";
import { getOutcomesForCrime, type Crime, type CrimeWithOutcomes } from "@/lib/police-api";
import { categoryName, colorFor } from "@/components/CategoryFilter";
import type { CrimeCategory } from "@/lib/police-api";

type Props = {
  crime: Crime | null;
  categories: CrimeCategory[];
  onClose: () => void;
};

export default function OutcomeModal({ crime, categories, onClose }: Props) {
  const hasPersistentId = !!crime?.persistent_id;
  const isASB = crime?.category === "anti-social-behaviour";
  const [data, setData] = useState<CrimeWithOutcomes | null>(null);
  const [loading, setLoading] = useState(hasPersistentId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!crime || !hasPersistentId) {
      return;
    }
    let cancelled = false;
    getOutcomesForCrime(crime.persistent_id)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load outcomes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [crime, hasPersistentId]);

  useEffect(() => {
    if (!crime) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [crime, onClose]);

  if (!crime) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-2xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: colorFor(crime.category) }}
              />
              <h3 className="text-base font-semibold">
                {categoryName(crime.category, categories)}
              </h3>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {crime.location.street.name} · {crime.month}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {loading && <p className="py-8 text-center text-sm text-zinc-500">Loading outcomes...</p>}
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {!loading && !hasPersistentId && (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {isASB
                  ? "Outcomes are not available for anti-social behaviour incidents. ASB is recorded as an incident, not a crime, so no outcome data is collected."
                  : "This incident does not have a persistent ID, so outcome history is unavailable."}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800">
              <p>Persistent ID: <span className="font-mono break-all">{crime.persistent_id || "N/A"}</span></p>
              <p className="mt-1">Crime ID: <span className="font-mono">{crime.id}</span></p>
            </div>
          </div>
        )}

        {!loading && hasPersistentId && data && (
          <div className="space-y-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Latest outcome
              </p>
              <p className="mt-1 text-sm">
                {crime.outcome_status
                  ? crime.outcome_status.category
                  : "No outcome recorded"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Outcome history ({data.outcomes.length})
              </p>
              {data.outcomes.length === 0 ? (
                <p className="text-sm text-zinc-500">No outcomes recorded.</p>
              ) : (
                <ol className="relative space-y-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
                  {data.outcomes.map((outcome, idx) => (
                    <li key={idx} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-zinc-400 ring-2 ring-white dark:ring-zinc-950" />
                      <p className="text-sm font-medium">{outcome.category.name}</p>
                      <p className="text-xs text-zinc-500">
                        {outcome.date ?? "Date unknown"}
                        {outcome.person_id != null && ` · Person #${outcome.person_id}`}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="rounded-lg border border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800">
              <p>Persistent ID: <span className="font-mono break-all">{crime.persistent_id || "N/A"}</span></p>
              <p className="mt-1">Crime ID: <span className="font-mono">{crime.id}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}