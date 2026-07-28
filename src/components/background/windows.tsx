"use client";

import { useRoundSignal } from "@/hooks/use-round-signal";
import { useWindowLights } from "@/hooks/use-window-lights";
import {
  WINDOW_GLOW_COLOR,
  WINDOW_GLOW_OPACITY,
  WINDOW_SHUTTER_COLOR,
  WINDOW_SHUTTER_WIDTH_RATIO,
  WINDOW_SPECS,
  WINDOW_TRANSITION_MS,
} from "@/lib/window-constants";

// A handful of the piazza's windows that occasionally light up and swing
// their shutters open on a round start — purely decorative, no game state,
// same rationale as the rest of components/background/ (CLAUDE.md §4).
//
// Each window is additive, not a cover-and-reveal over the art: the glow
// sits inside the window's existing dark rectangle (already drawn in
// piazza.png) and just brightens, while the two shutters live just outside
// the window's edges and swing out via `transform: scaleX()` from that
// edge — nothing needs to match the backdrop's pixel art exactly, so
// there's no seam risk like there would be trying to hide/reveal the
// window itself.
function Window({ id, spec, open }: { id: string; spec: (typeof WINDOW_SPECS)[number]; open: boolean }) {
  const shutterWidthPx = spec.widthPx * WINDOW_SHUTTER_WIDTH_RATIO;

  return (
    <div
      key={id}
      className="absolute"
      style={{
        left: `${spec.xPercent}%`,
        top: `${spec.yPercent}%`,
        width: spec.widthPx,
        height: spec.heightPx,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* The light, glowing through the window's own existing dark pane. */}
      <div
        className="absolute inset-0.5"
        style={{
          backgroundColor: WINDOW_GLOW_COLOR,
          opacity: open ? WINDOW_GLOW_OPACITY : 0,
          transition: `opacity ${WINDOW_TRANSITION_MS}ms ease-out`,
        }}
      />

      {/* Left shutter — pivots open from the window's left edge. */}
      <div
        className="absolute top-0"
        style={{
          right: "100%",
          width: shutterWidthPx,
          height: spec.heightPx,
          backgroundColor: WINDOW_SHUTTER_COLOR,
          transformOrigin: "right center",
          transform: `scaleX(${open ? 1 : 0})`,
          opacity: open ? 1 : 0,
          transition: `transform ${WINDOW_TRANSITION_MS}ms ease-out, opacity ${WINDOW_TRANSITION_MS}ms ease-out`,
        }}
      />

      {/* Right shutter — mirrors the left, pivoting from the right edge. */}
      <div
        className="absolute top-0"
        style={{
          left: "100%",
          width: shutterWidthPx,
          height: spec.heightPx,
          backgroundColor: WINDOW_SHUTTER_COLOR,
          transformOrigin: "left center",
          transform: `scaleX(${open ? 1 : 0})`,
          opacity: open ? 1 : 0,
          transition: `transform ${WINDOW_TRANSITION_MS}ms ease-out, opacity ${WINDOW_TRANSITION_MS}ms ease-out`,
        }}
      />
    </div>
  );
}

export function Windows() {
  const { roundStartToken } = useRoundSignal();
  const openWindows = useWindowLights(roundStartToken);

  return (
    <div className="absolute inset-0" aria-hidden>
      {WINDOW_SPECS.map((spec) => (
        <Window key={spec.id} id={spec.id} spec={spec} open={openWindows[spec.id]} />
      ))}
    </div>
  );
}
