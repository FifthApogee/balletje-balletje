"use client";

// Animated water streams for the fountain's three spouts (see fountain.tsx
// for the sprite and the spout coordinates this anchors to). Purely
// decorative, same rationale as the rest of src/components/background/ for
// living outside src/components/game/ (CLAUDE.md §4).
//
// CSS-only animation (no library, per CLAUDE.md §4): each stream is a thin
// vertical bar whose height is transitioned between 0 and its target via
// `transform: scaleY`, growing from the spout downward. `flowingSpouts` is
// the one prop callers toggle (per spout, independently); this component
// owns no timer of its own — see use-fountain-water.ts for the timing.

import type { FountainSpout } from "@/hooks/use-fountain-water";
import { FOUNTAIN_FRONT_SPOUT_PERCENT, FOUNTAIN_LEFT_SPOUT_PERCENT, FOUNTAIN_RIGHT_SPOUT_PERCENT } from "./fountain";

const STREAM_WIDTH_PX = 3;
const STREAM_COLOR = "oklch(0.85 0.03 230 / 0.85)";
const STREAM_TRANSITION_MS = 260;

// How far below the spout the water falls before hitting the basin, as a
// fraction of the fountain sprite's own height.
const STREAM_DROP_PERCENT = 14;

const SPOUT_POSITIONS: Record<FountainSpout, { x: number; y: number }> = {
  left: FOUNTAIN_LEFT_SPOUT_PERCENT,
  right: FOUNTAIN_RIGHT_SPOUT_PERCENT,
  front: FOUNTAIN_FRONT_SPOUT_PERCENT,
};

function Stream({ spout, flowing }: { spout: { x: number; y: number }; flowing: boolean }) {
  return (
    <div
      className="absolute transition-transform"
      style={{
        left: `${spout.x}%`,
        top: `${spout.y}%`,
        width: STREAM_WIDTH_PX,
        height: `${STREAM_DROP_PERCENT}%`,
        transitionDuration: `${STREAM_TRANSITION_MS}ms`,
        transitionTimingFunction: flowing ? "ease-out" : "ease-in",
        transform: `translateX(-50%) scaleY(${flowing ? 1 : 0})`,
        transformOrigin: "top",
        opacity: flowing ? 1 : 0,
      }}
    >
      <div
        className="h-full w-full"
        style={{
          backgroundColor: STREAM_COLOR,
          borderRadius: STREAM_WIDTH_PX,
        }}
      />
    </div>
  );
}

export function FountainWater({
  flowingSpouts,
  width,
}: {
  flowingSpouts: Record<FountainSpout, boolean>;
  width: number;
}) {
  const height = width * (529 / 723);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ width, height }}>
      {(Object.keys(SPOUT_POSITIONS) as FountainSpout[]).map((spout) => (
        <Stream key={spout} spout={SPOUT_POSITIONS[spout]} flowing={flowingSpouts[spout]} />
      ))}
    </div>
  );
}
