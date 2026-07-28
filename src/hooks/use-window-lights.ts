"use client";

import { useState } from "react";
import { decideWindowToggles } from "@/lib/window";
import { WINDOW_SPECS, type WindowId } from "@/lib/window-constants";

function allClosed(): Record<WindowId, boolean> {
  return Object.fromEntries(WINDOW_SPECS.map((spec) => [spec.id, false])) as Record<WindowId, boolean>;
}

/**
 * Tracks each window's open/closed (lit/dark) state, toggling a subset on
 * every round start per lib/window.ts's rules — tied to use-round-signal.ts,
 * same trigger as the fountain and church bells.
 *
 * Adjusted during render rather than in an effect, since there's no real
 * side effect here (no timer, no Audio element) — just state derived from a
 * changing prop, React's own recommended shape for that case. Comparing
 * roundStartToken against the last value it's seen and rolling a fresh
 * toggle only on the render where it actually changed also sidesteps the
 * "skip the spurious mount-effect fire" dance the fountain/bells hooks need
 * (isInitialMountRef): lastToken starts equal to roundStartToken, so the
 * very first render never toggles anything.
 */
export function useWindowLights(roundStartToken: number): Record<WindowId, boolean> {
  const [openWindows, setOpenWindows] = useState<Record<WindowId, boolean>>(allClosed);
  const [lastToken, setLastToken] = useState(roundStartToken);

  if (roundStartToken !== lastToken) {
    setLastToken(roundStartToken);
    const toggled = decideWindowToggles();
    if (toggled.length > 0) {
      setOpenWindows((prev) => {
        const next = { ...prev };
        toggled.forEach((id) => {
          next[id] = !next[id];
        });
        return next;
      });
    }
  }

  return openWindows;
}
