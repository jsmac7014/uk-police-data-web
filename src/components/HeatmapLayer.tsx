"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { Crime } from "@/lib/police-api";

type Props = {
  crimes: Crime[];
  filter: string;
};

export default function HeatmapLayer({ crimes, filter }: Props) {
  const map = useMap();
  const heatRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    const filtered = filter === "all-crime" ? crimes : crimes.filter((c) => c.category === filter);

    const points: [number, number, number][] = filtered
      .filter((c) => c.location.latitude && c.location.longitude)
      .map((c) => [
        parseFloat(c.location.latitude!),
        parseFloat(c.location.longitude!),
        0.8,
      ]);

    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }

    if (points.length === 0) return;

    const heatLayer = (L as unknown as { heatLayer: (points: [number, number, number][], opts: Record<string, unknown>) => L.Layer }).heatLayer(points, {
      radius: 25,
      blur: 18,
      maxZoom: 15,
      max: 1.5,
      gradient: {
        0.2: "#22c55e",
        0.4: "#eab308",
        0.6: "#f97316",
        0.8: "#dc2626",
        1.0: "#7f1d1d",
      },
    });

    map.addLayer(heatLayer);
    heatRef.current = heatLayer;

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
    };
  }, [map, crimes, filter]);

  return null;
}