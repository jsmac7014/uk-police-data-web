"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { Crime, CrimeCategory, StopAndSearch } from "@/lib/police-api";
import ClusterLayer from "@/components/ClusterLayer";
import HeatmapLayer from "@/components/HeatmapLayer";

export type ViewMode = "cluster" | "heatmap";

type Props = {
  crimes: Crime[];
  categories: CrimeCategory[];
  center: [number, number];
  filter: string;
  stops: StopAndSearch[];
  showStops: boolean;
  viewMode: ViewMode;
  onCrimeClick?: (crime: Crime) => void;
  onMapMove?: (center: { lat: number; lng: number }) => void;
};

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  const lastCenterRef = useRef<[number, number]>(center);
  useEffect(() => {
    const last = lastCenterRef.current;
    if (last[0] !== center[0] || last[1] !== center[1]) {
      lastCenterRef.current = center;
      map.flyTo(center, 13, { duration: 0.8 });
    }
  }, [map, center]);
  return null;
}

function MapMoveHandler({ onMapMove }: { onMapMove?: (center: { lat: number; lng: number }) => void }) {
  const map = useMap();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    function onMoveEnd() {
      const c = map.getCenter();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onMapMove?.({ lat: c.lat, lng: c.lng });
      }, 500);
    }
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [map, onMapMove]);
  return null;
}

export default function MapView({
  crimes,
  categories,
  center,
  filter,
  stops,
  showStops,
  viewMode,
  onCrimeClick,
  onMapMove,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    return () => {
      const id = (container as unknown as Record<string, unknown>)._leaflet_id;
      if (id) {
        delete (container as unknown as Record<string, unknown>)._leaflet_id;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <FlyTo center={center} />
        <MapMoveHandler onMapMove={onMapMove} />
        <Marker position={center} icon={centerIcon()} />

        {viewMode === "cluster" ? (
          <ClusterLayer
            crimes={crimes}
            categories={categories}
            filter={filter}
            stops={stops}
            showStops={showStops}
            onCrimeClick={onCrimeClick}
          />
        ) : (
          <HeatmapLayer crimes={crimes} filter={filter} />
        )}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] hidden rounded-md bg-white/90 px-3 py-2 text-xs shadow-md dark:bg-zinc-900/90 dark:text-zinc-200 md:block">
        {filter === "all-crime"
          ? crimes.length
          : crimes.filter((c) => c.category === filter).length}
        {" "}crimes shown (1-mile radius)
        {showStops && stops.length > 0 && ` · ${stops.length} stop & search`}
      </div>
    </div>
  );
}

function centerIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 16px;
      height: 16px;
      background: #2563eb;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 2px #2563eb, 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}