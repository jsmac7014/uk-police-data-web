"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SnapPoint = "collapsed" | "half" | "full";

type Props = {
  header: React.ReactNode;
  children: React.ReactNode;
  snap: SnapPoint;
  onSnapChange: (snap: SnapPoint) => void;
};

const SNAP_HEIGHTS: Record<SnapPoint, string> = {
  collapsed: "88px",
  half: "50vh",
  full: "85vh",
};

export default function BottomSheet({ header, children, snap, onSnapChange }: Props) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const currentHeightRef = useRef(0);

  const updateHeight = useCallback((height: number) => {
    currentHeightRef.current = height;
    if (sheetRef.current) {
      sheetRef.current.style.height = `${height}px`;
    }
  }, []);

  const snapOrder: SnapPoint[] = ["collapsed", "half", "full"];

  const heightForSnap = (s: SnapPoint): number => {
    const h = SNAP_HEIGHTS[s];
    if (h.endsWith("vh")) return (window.innerHeight * parseInt(h)) / 100;
    return parseInt(h);
  };

  const nearestSnap = (height: number): SnapPoint => {
    const dists = snapOrder.map((s) => ({ s, d: Math.abs(heightForSnap(s) - height) }));
    dists.sort((a, b) => a.d - b.d);
    return dists[0].s;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = currentHeightRef.current || heightForSnap(snap);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = startYRef.current - e.clientY;
    const next = Math.max(80, Math.min(window.innerHeight - 60, startHeightRef.current + delta));
    updateHeight(next);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const nextSnap = nearestSnap(currentHeightRef.current);
    onSnapChange(nextSnap);
  };

  useEffect(() => {
    if (!dragging) {
      updateHeight(heightForSnap(snap));
    }
  }, [snap, dragging, updateHeight]);

  return (
    <div
      ref={sheetRef}
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[1100] flex flex-col rounded-t-2xl border-t border-zinc-200 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-[height] duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950 md:hidden"
      style={{ height: SNAP_HEIGHTS[snap], touchAction: "none" }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex shrink-0 cursor-grab touch-none flex-col items-center gap-1.5 pt-2.5 pb-1 active:cursor-grabbing"
      >
        <span className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
      </div>

      <div className="shrink-0 px-4 pb-2">{header}</div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
        {children}
      </div>
    </div>
  );
}