"use client";

import { useEffect, useState, type RefObject } from "react";

// Measures the stage's actual on-screen box (letterboxed to fit the
// viewport at a forced 16:9, see stage.tsx) and returns the numeric factor
// to scale the fixed-resolution design canvas up or down to fill it.
//
// This is the one bit of JS the forced-16:9 layout needs: CSS calc() can
// divide a length by a plain number, but not by another length to produce
// one — there is no pure-CSS way to turn "the box is currently 812px wide"
// into "scale by 0.59". ResizeObserver is the standard technique for
// fitting a fixed-resolution canvas to a container.
export function useStageScale(scalerRef: RefObject<HTMLDivElement | null>, designWidthPx: number): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = scalerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / designWidthPx);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [scalerRef, designWidthPx]);

  return scale;
}
