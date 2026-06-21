"use client";

import { useEffect, useRef, useState } from "react";

type SearchParams = { lat: number; lng: number; date: string; name: string };

type Props = {
  dates: string[];
  date: string;
  lat: number;
  lng: number;
  locationName: string;
  loading: boolean;
  onSearch: (params: SearchParams) => void;
};

type GeocodeResult = {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
};

export default function SearchForm({
  dates,
  date: dateProp,
  lat: latProp,
  lng: lngProp,
  locationName: nameProp,
  loading,
  onSearch,
}: Props) {
  const [lat, setLat] = useState(latProp.toString());
  const [lng, setLng] = useState(lngProp.toString());
  const [date, setDate] = useState(dateProp);
  const [name, setName] = useState(nameProp);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function fetchSuggestions(q: string) {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setGeocoding(true);
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&limit=6&accept-language=en&q=${encodeURIComponent(
      q
    )}`;
    fetch(url, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((data: GeocodeResult[]) => setSuggestions(data))
      .catch(() => setSuggestions([]))
      .finally(() => setGeocoding(false));
  }

  function onQueryChange(value: string) {
    setQuery(value);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350);
  }

  function selectSuggestion(s: GeocodeResult) {
    const selectedLat = parseFloat(s.lat);
    const selectedLng = parseFloat(s.lon);
    const shortName = s.display_name.split(",")[0];
    setLat(selectedLat.toString());
    setLng(selectedLng.toString());
    setName(shortName);
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch({ lat: selectedLat, lng: selectedLng, date, name: shortName });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSearch({ lat: parseFloat(lat), lng: parseFloat(lng), date, name });
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={containerRef} className="relative flex flex-col gap-1">
        <label className="text-sm">
          <span className="font-medium">Search UK location</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="e.g. Westminster, Oxford Street, EH1"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-white"
          />
          {geocoding && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
              Searching...
            </span>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute top-full z-[1200] mt-1 max-h-64 w-full overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {suggestions.map((s) => (
              <li key={s.place_id}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="block w-full px-3 py-2 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {s.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Location name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. London"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-white"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Latitude</span>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Longitude</span>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-white"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Month</span>
          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-white"
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Loading..." : "Fetch crime data"}
        </button>
      </form>

    </div>
  );
}