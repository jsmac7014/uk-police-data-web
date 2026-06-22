"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { Crime, CrimeCategory, StopAndSearch } from "@/lib/police-api";
import { colorFor, categoryName } from "@/components/CategoryFilter";

type Props = {
  crimes: Crime[];
  categories: CrimeCategory[];
  filter: string;
  stops: StopAndSearch[];
  showStops: boolean;
  onCrimeClick?: (crime: Crime) => void;
};

export default function ClusterLayer({
  crimes,
  categories,
  filter,
  stops,
  showStops,
  onCrimeClick,
}: Props) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const stopsRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (c) => {
        const count = c.getChildCount();
        const size = count < 10 ? 36 : count < 100 ? 42 : 52;
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;line-height:${size}px;
            text-align:center;font-size:12px;font-weight:600;color:#fff;
            background:rgba(24,24,27,0.85);border:2px solid rgba(255,255,255,0.9);
            border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);
          ">${count}</div>`,
          className: "crime-cluster",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });
    map.addLayer(clusterGroup);
    clusterRef.current = clusterGroup;

    const stopsGroup = L.layerGroup();
    map.addLayer(stopsGroup);
    stopsRef.current = stopsGroup;

    return () => {
      map.removeLayer(clusterGroup);
      map.removeLayer(stopsGroup);
      clusterRef.current = null;
      stopsRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const clusterGroup = clusterRef.current;
    if (!clusterGroup) return;
    clusterGroup.clearLayers();

    const filtered = filter === "all-crime" ? crimes : crimes.filter((c) => c.category === filter);

    for (const crime of filtered) {
      const lat = crime.location.latitude;
      const lng = crime.location.longitude;
      if (!lat || !lng) continue;
      const marker = L.circleMarker([parseFloat(lat), parseFloat(lng)], {
        radius: 6,
        color: colorFor(crime.category),
        fillColor: colorFor(crime.category),
        fillOpacity: 0.7,
        weight: 1,
      });
      marker.bindPopup(
        `<div style="min-width:180px">
          <div style="font-weight:600;margin-bottom:2px">${categoryName(crime.category, categories)}</div>
          <div style="color:#52525b;font-size:12px">${crime.location.street.name}</div>
          <div style="color:#71717a;font-size:12px">${crime.month}</div>
          ${crime.outcome_status ? `<div style="color:#52525b;font-size:12px;margin-top:2px">Outcome: ${crime.outcome_status.category}</div>` : ""}
          ${crime.persistent_id ? `<button type="button" data-crime-id="${crime.id}" style="margin-top:6px;padding:4px 10px;font-size:12px;font-weight:500;background:#18181b;color:#fff;border:none;border-radius:4px;cursor:pointer">View full outcome history</button>` : ""}
        </div>`
      );
      marker.on("click", (e) => {
        (e as L.LeafletMouseEvent).originalEvent.stopPropagation();
        onCrimeClick?.(crime);
      });
      clusterGroup.addLayer(marker);
    }
  }, [crimes, categories, filter, onCrimeClick]);

  useEffect(() => {
    const stopsGroup = stopsRef.current;
    if (!stopsGroup) return;
    stopsGroup.clearLayers();

    if (!showStops) return;

    for (const stop of stops) {
      const lat = stop.location.latitude;
      const lng = stop.location.longitude;
      if (!lat || !lng) continue;
      const marker = L.marker([parseFloat(lat), parseFloat(lng)], { icon: stopIcon() });
      marker.bindPopup(
        `<div style="min-width:220px">
          <div style="font-weight:600;margin-bottom:2px">Stop and Search</div>
          <div style="color:#52525b;font-size:12px">${stop.location.street.name}</div>
          <div style="color:#71717a;font-size:12px">${new Date(stop.datetime).toLocaleString()}</div>
          ${stop.type ? `<div style="color:#52525b;font-size:12px">Type: ${stop.type}</div>` : ""}
          ${stop.gender ? `<div style="color:#52525b;font-size:12px">Gender: ${stop.gender}</div>` : ""}
          ${stop.age_range ? `<div style="color:#52525b;font-size:12px">Age: ${stop.age_range}</div>` : ""}
          ${stop.object_of_search ? `<div style="color:#52525b;font-size:12px">Object: ${stop.object_of_search}</div>` : ""}
          ${stop.outcome ? `<div style="color:#52525b;font-size:12px">Outcome: ${stop.outcome}</div>` : ""}
          ${stop.legislation ? `<div style="color:#52525b;font-size:12px">Legislation: ${stop.legislation}</div>` : ""}
        </div>`
      );
      stopsGroup.addLayer(marker);
    }
  }, [stops, showStops]);

  return null;
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