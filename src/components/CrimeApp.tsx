"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import SearchPanel from "@/components/SearchPanel";
import SearchForm from "@/components/SearchForm";
import CategoryFilter from "@/components/CategoryFilter";
import BottomSheet from "@/components/BottomSheet";
import OutcomeModal from "@/components/OutcomeModal";
import OutcomeBreakdown from "@/components/OutcomeBreakdown";
import TrendChart from "@/components/TrendChart";
import DownloadButton from "@/components/DownloadButton";
import type { ViewMode } from "@/components/MapView";
import {
  getStreetCrimes,
  getStopsStreet,
  type Crime,
  type CrimeCategory,
  type StopAndSearch,
} from "@/lib/police-api";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900">
      Loading map...
    </div>
  ),
});

type Props = {
  initialDates: string[];
  initialCrimes: Crime[];
  initialStops: StopAndSearch[];
  initialCategories: CrimeCategory[];
  initialDate: string;
  initialLat: number;
  initialLng: number;
  initialLocationName: string;
};

type SnapPoint = "collapsed" | "half" | "full";
type MobileTab = "search" | "categories" | "outcomes" | "trend";

export default function CrimeApp({
  initialDates,
  initialCrimes,
  initialStops,
  initialCategories,
  initialDate,
  initialLat,
  initialLng,
  initialLocationName,
}: Props) {
  const [crimes, setCrimes] = useState<Crime[]>(initialCrimes);
  const [stops, setStops] = useState<StopAndSearch[]>(initialStops);
  const [categories] = useState<CrimeCategory[]>(initialCategories);
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [searchCenter, setSearchCenter] = useState<[number, number]>([initialLat, initialLng]);
  const [date, setDate] = useState(initialDate);
  const [locationName, setLocationName] = useState(initialLocationName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all-crime");
  const [snap, setSnap] = useState<SnapPoint>("half");
  const [showStops, setShowStops] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("cluster");
  const [selectedCrime, setSelectedCrime] = useState<Crime | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("search");
  const [mapLoading, setMapLoading] = useState(false);
  const [pendingCenter, setPendingCenter] = useState<{ lat: number; lng: number } | null>(null);
  const lastMoveRef = useRef<{ lat: number; lng: number } | null>(null);
  const [mapEl, setMapEl] = useState<HTMLDivElement | null>(null);
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    setMapEl(node);
  }, []);

  const trendDates = useMemo(() => {
    const idx = initialDates.indexOf(date);
    const start = idx >= 0 ? Math.max(0, idx - 11) : 0;
    return initialDates.slice(start, start + 12).reverse();
  }, [initialDates, date]);

  const handleSearch = useCallback(
    async (params: { lat: number; lng: number; date: string; name: string }) => {
      setLoading(true);
      setError(null);
      try {
        const [crimesResult, stopsResult] = await Promise.all([
          getStreetCrimes({ lat: params.lat, lng: params.lng, date: params.date }),
          getStopsStreet({ lat: params.lat, lng: params.lng, date: params.date }),
        ]);
        setCrimes(crimesResult);
        setStops(stopsResult);
        setLat(params.lat);
        setLng(params.lng);
        setSearchCenter([params.lat, params.lng]);
        setDate(params.date);
        setLocationName(params.name);
        setFilter("all-crime");
        lastMoveRef.current = { lat: params.lat, lng: params.lng };
        setPendingCenter(null);
        if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
          setSnap("collapsed");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data.");
        setCrimes([]);
        setStops([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleMapMove = useCallback((newCenter: { lat: number; lng: number }) => {
    const last = lastMoveRef.current;
    const dist = last
      ? Math.sqrt((last.lat - newCenter.lat) ** 2 + (last.lng - newCenter.lng) ** 2)
      : Infinity;
    if (dist < 0.01) return;
    setPendingCenter(newCenter);
  }, []);

  const handleSearchHere = useCallback(async () => {
    if (!pendingCenter) return;
    const newCenter = pendingCenter;
    setPendingCenter(null);
    lastMoveRef.current = newCenter;
    setMapLoading(true);
    setError(null);
    try {
      const [crimesResult, stopsResult] = await Promise.all([
        getStreetCrimes({ lat: newCenter.lat, lng: newCenter.lng, date }),
        getStopsStreet({ lat: newCenter.lat, lng: newCenter.lng, date }),
      ]);
      setCrimes(crimesResult);
      setStops(stopsResult);
      setLat(newCenter.lat);
      setLng(newCenter.lng);
      setFilter("all-crime");
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newCenter.lat}&lon=${newCenter.lng}&zoom=14&accept-language=en&countrycodes=gb`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const parts = (geoData.display_name as string).split(",");
          const name = parts.slice(0, 2).join(", ").trim();
          setLocationName(name || "Map location");
        }
      } catch {
        setLocationName("Map location");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data.");
    } finally {
      setMapLoading(false);
    }
  }, [pendingCenter, date]);

  const filteredCount =
    filter === "all-crime" ? crimes.length : crimes.filter((c) => c.category === filter).length;

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      <SearchPanel
        key={`desktop-${lat}-${lng}-${date}`}
        dates={initialDates}
        date={date}
        lat={lat}
        lng={lng}
        locationName={locationName}
        loading={loading}
        onSearch={handleSearch}
        crimes={crimes}
        stops={stops}
        showStops={showStops}
        onToggleStops={() => setShowStops((s) => !s)}
        categories={categories}
        filter={filter}
        onFilterChange={setFilter}
        trendDates={trendDates}
      />

      <main className="relative flex flex-1 flex-col">
        <div className="hidden border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950 md:block">
          <h2 className="text-sm font-medium">
            {locationName}{" "}
            <span className="text-zinc-500">· {date} · {crimes.length} crimes</span>
          </h2>
        </div>

        <div className="hidden items-center gap-2 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:flex">
          <CategoryFilter
            crimes={crimes}
            categories={categories}
            filter={filter}
            onFilterChange={setFilter}
          />
          <div className="ml-auto mr-3 flex items-center gap-2">
            <div className="flex overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setViewMode("cluster")}
                className={`px-3 py-1 text-xs font-medium transition ${
                  viewMode === "cluster"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-300"
                }`}
              >
                Cluster
              </button>
              <button
                onClick={() => setViewMode("heatmap")}
                className={`px-3 py-1 text-xs font-medium transition ${
                  viewMode === "heatmap"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-300"
                }`}
              >
                Heatmap
              </button>
            </div>
            <button
              onClick={() => setShowStops((s) => !s)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                showStops
                  ? "bg-amber-400 text-amber-950"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              <span className="inline-block h-2.5 w-2.5 rotate-45 rounded-[2px] bg-amber-700" />
              Stop &amp; Search ({stops.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 px-5 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div ref={mapContainerRef} className="relative flex-1">
          <MapView
            crimes={crimes}
            categories={categories}
            center={searchCenter}
            filter={filter}
            stops={stops}
            showStops={showStops}
            viewMode={viewMode}
            onCrimeClick={setSelectedCrime}
            onMapMove={handleMapMove}
          />
          {mapLoading && (
            <div className="pointer-events-none absolute top-3 left-1/2 z-[1500] -translate-x-1/2 rounded-full bg-zinc-900/90 px-4 py-2 text-xs font-medium text-white shadow-lg">
              Loading data for this area...
            </div>
          )}
          {pendingCenter && !mapLoading && (
            <button
              onClick={handleSearchHere}
              className="absolute top-3 left-1/2 z-[1500] -translate-x-1/2 flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-3-6.7L21 8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Search this area
            </button>
          )}
          <div className="absolute right-3 top-3 z-[1500]">
            <DownloadButton
              mapContainer={mapEl}
              locationName={locationName}
              date={date}
              crimeCount={filter === "all-crime" ? crimes.length : crimes.filter((c) => c.category === filter).length}
              filterLabel={filter === "all-crime" ? "All crime" : filter}
            />
          </div>
        </div>

        <BottomSheet
          snap={snap}
          onSnapChange={setSnap}
          header={
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{locationName}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {date} · {filteredCount} shown / {crimes.length} total
                  {showStops && stops.length > 0 && ` · ${stops.length} stops`}
                </p>
              </div>
              <button
                onClick={() => setSnap(snap === "full" ? "collapsed" : "full")}
                className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {snap === "full" ? "Collapse" : "Expand"}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
              {(["search", "categories", "outcomes", "trend"] as MobileTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition ${
                    mobileTab === tab
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {tab === "search"
                    ? "Search"
                    : tab === "categories"
                      ? "Categories"
                      : tab === "outcomes"
                        ? "Outcomes"
                        : "Trend"}
                </button>
              ))}
            </div>

            {mobileTab === "search" && (
              <SearchForm
                key={`mobile-${lat}-${lng}-${date}`}
                dates={initialDates}
                date={date}
                lat={lat}
                lng={lng}
                locationName={locationName}
                loading={loading}
                onSearch={handleSearch}
              />
            )}

            {mobileTab === "categories" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={() => setViewMode("cluster")}
                      className={`px-3 py-1 text-xs font-medium transition ${
                        viewMode === "cluster"
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : "bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                      }`}
                    >
                      Cluster
                    </button>
                    <button
                      onClick={() => setViewMode("heatmap")}
                      className={`px-3 py-1 text-xs font-medium transition ${
                        viewMode === "heatmap"
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : "bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                      }`}
                    >
                      Heatmap
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showStops}
                      onChange={(e) => setShowStops(e.target.checked)}
                      className="h-4 w-4 accent-amber-500"
                    />
                    <span>Stops ({stops.length})</span>
                  </label>
                </div>
                <CategoryFilter
                  crimes={crimes}
                  categories={categories}
                  filter={filter}
                  onFilterChange={setFilter}
                  variant="list"
                />
              </div>
            )}

            {mobileTab === "outcomes" && <OutcomeBreakdown crimes={crimes} />}

            {mobileTab === "trend" && (
              <TrendChart
                key={`mobile-${lat},${lng}`}
                lat={lat}
                lng={lng}
                dates={trendDates}
                categories={categories}
              />
            )}

            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              Crime locations are approximations, not exact addresses. Data is returned within a
              1-mile radius.
            </p>
          </div>
        </BottomSheet>
      </main>

      <OutcomeModal
        key={selectedCrime?.id ?? "none"}
        crime={selectedCrime}
        categories={categories}
        onClose={() => setSelectedCrime(null)}
      />
    </div>
  );
}