"use client";

import SearchForm from "@/components/SearchForm";
import CategoryFilter from "@/components/CategoryFilter";
import TrendChart from "@/components/TrendChart";
import OutcomeBreakdown from "@/components/OutcomeBreakdown";
import type { Crime, CrimeCategory, StopAndSearch } from "@/lib/police-api";

type SearchParams = { lat: number; lng: number; date: string; name: string };

type Props = {
  dates: string[];
  date: string;
  lat: number;
  lng: number;
  locationName: string;
  loading: boolean;
  onSearch: (params: SearchParams) => void;
  crimes: Crime[];
  stops: StopAndSearch[];
  showStops: boolean;
  onToggleStops: () => void;
  categories: CrimeCategory[];
  filter: string;
  onFilterChange: (filter: string) => void;
  trendDates: string[];
};

export default function SearchPanel({
  dates,
  date,
  lat,
  lng,
  locationName,
  loading,
  onSearch,
  crimes,
  stops,
  showStops,
  onToggleStops,
  categories,
  filter,
  onFilterChange,
  trendDates,
}: Props) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto border-r border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 md:flex">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">UK Crime Map</h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          UK crime map powered by the data.police.uk API
        </p>
      </div>

      <SearchForm
        dates={dates}
        date={date}
        lat={lat}
        lng={lng}
        locationName={locationName}
        loading={loading}
        onSearch={onSearch}
      />

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showStops}
            onChange={onToggleStops}
            className="h-4 w-4 accent-amber-500"
          />
          <span>Show stop &amp; search ({stops.length})</span>
        </label>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Crime categories
          </p>
          <CategoryFilter
            crimes={crimes}
            categories={categories}
            filter={filter}
            onFilterChange={onFilterChange}
            variant="list"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Outcome breakdown
        </p>
        <OutcomeBreakdown crimes={crimes} />
      </div>

      <div>
        <TrendChart key={`${lat},${lng}`} lat={lat} lng={lng} dates={trendDates} categories={categories} />
      </div>

      <p className="mt-auto text-xs text-zinc-400 dark:text-zinc-500">
        Crime locations are approximations, not exact addresses. Data is returned within a 1-mile
        radius.
      </p>
    </aside>
  );
}