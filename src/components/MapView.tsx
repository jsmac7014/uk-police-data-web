"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  Marker,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import type { Crime, StopAndSearch } from "@/lib/police-api";
import { colorFor } from "@/components/CategoryFilter";

type Props = {
  crimes: Crime[];
  center: [number, number];
  filter: string;
  stops: StopAndSearch[];
  showStops: boolean;
  onCrimeClick?: (crime: Crime) => void;
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

export default function MapView({
  crimes,
  center,
  filter,
  stops,
  showStops,
  onCrimeClick,
}: Props) {
  const filtered = filter === "all-crime" ? crimes : crimes.filter((c) => c.category === filter);
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
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Streets">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Light">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Dark">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <FlyTo center={center} />
        <Marker position={center} icon={centerIcon()} />

        {filtered.map((crime) => {
          const lat = crime.location.latitude;
          const lng = crime.location.longitude;
          if (!lat || !lng) return null;
          const position: [number, number] = [parseFloat(lat), parseFloat(lng)];
          return (
            <CircleMarker
              key={crime.id}
              center={position}
              radius={6}
              pathOptions={{
                color: colorFor(crime.category),
                fillColor: colorFor(crime.category),
                fillOpacity: 0.7,
                weight: 1,
              }}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  onCrimeClick?.(crime);
                },
              }}
            />
          );
        })}

        {showStops &&
          stops.map((stop, idx) => {
            const lat = stop.location.latitude;
            const lng = stop.location.longitude;
            if (!lat || !lng) return null;
            const position: [number, number] = [parseFloat(lat), parseFloat(lng)];
            return (
              <Marker key={`stop-${idx}`} position={position} icon={stopIcon()}>
                <Popup>
                  <div className="min-w-[220px] space-y-1.5 text-sm">
                    <p className="font-semibold">Stop and Search</p>
                    <p className="text-zinc-600">{stop.location.street.name}</p>
                    <p className="text-zinc-500">{new Date(stop.datetime).toLocaleString()}</p>
                    {stop.type && <p className="text-zinc-600">Type: {stop.type}</p>}
                    {stop.gender && <p className="text-zinc-600">Gender: {stop.gender}</p>}
                    {stop.age_range && <p className="text-zinc-600">Age: {stop.age_range}</p>}
                    {stop.object_of_search && (
                      <p className="text-zinc-600">Object: {stop.object_of_search}</p>
                    )}
                    {stop.outcome && <p className="text-zinc-600">Outcome: {stop.outcome}</p>}
                    {stop.legislation && (
                      <p className="text-zinc-600">Legislation: {stop.legislation}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] hidden rounded-md bg-white/90 px-3 py-2 text-xs shadow-md dark:bg-zinc-900/90 dark:text-zinc-200 md:block">
        {filtered.length} crimes shown (1-mile radius)
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

function stopIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 14px;
      height: 14px;
      background: #facc15;
      border: 2px solid #78350f;
      border-radius: 3px;
      transform: rotate(45deg);
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}