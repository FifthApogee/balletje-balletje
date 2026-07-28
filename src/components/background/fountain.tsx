"use client";

import { assetPath } from "@/lib/asset-path";

// The piazza's fountain — purely decorative, no game state or logic, same
// rationale as table-platform.tsx for living here instead of
// src/components/game/ (see CLAUDE.md §4 architecture boundaries).
//
// public/background/fountain.png is a standalone render (image-source/fountain.png,
// supplied by Stefan) with its white background color-keyed to transparent
// and trimmed to content — a real cutout, not a rectangular crop off the
// piazza backdrop like the previous version of this file used.
//
// The two faucet spouts' pixel coordinates are recorded below as percentages
// of the sprite's own box, so a future water-stream overlay (CSS/SVG) can
// anchor to each tip regardless of what size this component is rendered at.
// Measured directly off public/background/fountain.png (native 723x529).

const FOUNTAIN_SRC = assetPath("/background/fountain.png");
// Native trimmed size, in px — keep the aspect ratio (723:529) if resizing.
const FOUNTAIN_WIDTH_PX = 723;
const FOUNTAIN_HEIGHT_PX = 529;

// Where each spout's mouth sits, as % of the sprite's own width/height.
export const FOUNTAIN_LEFT_SPOUT_PERCENT = { x: 29.2, y: 36.9 };
export const FOUNTAIN_RIGHT_SPOUT_PERCENT = { x: 56.8, y: 36.9 };
// The third spout — the carved relief on the front of the central pillar,
// facing the viewer, same rough height as the two side arms.
export const FOUNTAIN_FRONT_SPOUT_PERCENT = { x: 41.9, y: 40.8 };

export function Fountain({ width = FOUNTAIN_WIDTH_PX }: { width?: number }) {
  const height = width * (FOUNTAIN_HEIGHT_PX / FOUNTAIN_WIDTH_PX);
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        backgroundImage: `url(${FOUNTAIN_SRC})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    />
  );
}
