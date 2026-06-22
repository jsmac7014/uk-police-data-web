"use client";

import { useCallback, useState } from "react";

type Props = {
  mapContainer: HTMLElement | null;
  locationName: string;
  date: string;
  crimeCount: number;
  filterLabel: string;
};

export default function DownloadButton({
  mapContainer,
  locationName,
  date,
  crimeCount,
  filterLabel,
}: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!mapContainer) return;
    setDownloading(true);

    try {
      const mapEl = mapContainer.querySelector(".leaflet-map-pane") as HTMLElement;
      if (!mapEl) throw new Error("Map pane not found");

      const mapRect = mapContainer.getBoundingClientRect();
      const width = Math.round(mapRect.width);
      const height = Math.round(mapRect.height);

      const transform = mapEl.style.transform;
      const match = transform.match(/translate3d\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px/);
      const offsetX = match ? parseFloat(match[1]) : 0;
      const offsetY = match ? parseFloat(match[2]) : 0;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height + 80;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const tileLayers = mapEl.querySelectorAll(".leaflet-tile-loaded");
      const tilePromises: Promise<void>[] = [];

      tileLayers.forEach((tile) => {
        const img = tile as HTMLImageElement;
        const src = img.src || img.getAttribute("src");
        if (!src) return;

        const tileRect = img.getBoundingClientRect();
        const x = tileRect.left - mapRect.left;
        const y = tileRect.top - mapRect.top;

        tilePromises.push(
          new Promise<void>((resolve) => {
            const corsImg = new Image();
            corsImg.crossOrigin = "anonymous";
            corsImg.onload = () => {
              try {
                ctx.drawImage(corsImg, x, y, tileRect.width, tileRect.height);
              } catch {
                // skip
              }
              resolve();
            };
            corsImg.onerror = () => resolve();
            corsImg.src = src;
          })
        );
      });

      await Promise.all(tilePromises);

      const svgPromises: Promise<void>[] = [];
      const svgLayers = mapEl.querySelectorAll(".leaflet-overlay-pane svg");
      svgLayers.forEach((svgEl) => {
        svgPromises.push(
          new Promise<void>((resolve) => {
            try {
              const svgRect = svgEl.getBoundingClientRect();
              const svgStr = new XMLSerializer().serializeToString(svgEl);
              const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
              const svgUrl = URL.createObjectURL(svgBlob);
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(
                  img,
                  svgRect.left - mapRect.left + offsetX,
                  svgRect.top - mapRect.top + offsetY,
                  svgRect.width,
                  svgRect.height
                );
                URL.revokeObjectURL(svgUrl);
                resolve();
              };
              img.onerror = () => {
                URL.revokeObjectURL(svgUrl);
                resolve();
              };
              img.src = svgUrl;
            } catch {
              resolve();
            }
          })
        );
      });

      await Promise.all(svgPromises);

      const heatmapCanvas = mapEl.querySelector("canvas.leaflet-heatmap-layer") as HTMLCanvasElement | null;
      if (heatmapCanvas) {
        try {
          const heatRect = heatmapCanvas.getBoundingClientRect();
          ctx.drawImage(
            heatmapCanvas,
            heatRect.left - mapRect.left,
            heatRect.top - mapRect.top,
            heatRect.width,
            heatRect.height
          );
        } catch {
          // skip
        }
      }

      const markers = mapEl.querySelectorAll(".leaflet-marker-icon, .leaflet-div-icon");
      markers.forEach((marker) => {
        const el = marker as HTMLElement;
        const rect = el.getBoundingClientRect();
        const x = rect.left - mapRect.left;
        const y = rect.top - mapRect.top;

        const html = el.outerHTML;
        if (html.includes("background:")) {
          const bgMatch = html.match(/background:\s*(#[0-9a-fA-F]+)/);
          const borderMatch = html.match(/border:\s*\d+px\s+solid\s+(white|#fff|#ffffff)/);
          if (bgMatch) {
            ctx.beginPath();
            ctx.arc(x + rect.width / 2, y + rect.height / 2, rect.width / 2, 0, Math.PI * 2);
            ctx.fillStyle = bgMatch[1];
            ctx.fill();
            if (borderMatch) {
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        }
      });

      ctx.fillStyle = "#18181b";
      ctx.fillRect(0, height, width, 80);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(locationName, 16, height + 28);

      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#a1a1aa";
      ctx.fillText(
        `${date} · ${crimeCount} crimes · ${filterLabel}`,
        16,
        height + 50
      );

      ctx.fillStyle = "#71717a";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("Source: data.police.uk", width - 16, height + 28);
      ctx.fillText("UK Crime Map", width - 16, height + 50);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${locationName.replace(/[^a-zA-Z0-9]/g, "_")}_crime_${date}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setDownloading(false);
    }
  }, [mapContainer, locationName, date, crimeCount, filterLabel]);

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-md transition hover:bg-zinc-100 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      title="Download map as PNG"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {downloading ? "Exporting..." : "Download"}
    </button>
  );
}