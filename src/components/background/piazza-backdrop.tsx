"use client";

import { useRef } from "react";
import { Clouds } from "./clouds";
import { Fountain } from "./fountain";
import { FountainWater } from "./fountain-water";
import { Windows } from "./windows";
import { useChurchBells } from "@/hooks/use-church-bells";
import { useFountainWater } from "@/hooks/use-fountain-water";
import { useRareEvent } from "@/hooks/use-rare-event";
import { useRoundSignal } from "@/hooks/use-round-signal";
import { assetPath } from "@/lib/asset-path";

// Purely decorative scenery — no game state, no interaction, no logic.
// Deliberately its own tree (src/components/background/), separate from
// src/components/game/, per CLAUDE.md §4. Client component (not a Server
// Component like the rest of this file used to be) because the fountain's
// water needs client-side timers — see use-fountain-water.ts.
//
// Z-tiers (recorded once, here): backdrop -z-10 · game z-0 · HUD pills z-20.
//
// Layered as a list, not a single flat image, so a future piece (e.g. the
// clock hands, see scene-constants.ts) can be sliced out of the art and
// swapped for a live component just by editing this list — nothing else
// in the game tree needs to change.

// Where the detailed cobblestone tiling gives way to the flat, monotone
// grey of the far piazza floor — measured directly off piazza.png (native
// 1376x768): a horizontal seam at y=633px, i.e. 82.4% of the image height.
// The fountain's own bottom edge is placed right on this line, since
// piazza.png no longer has any fountain baked into its art.
const GROUND_TEXTURE_SEAM_Y_PERCENT = 82.4;

const FOUNTAIN_WIDTH_PX = 220;
// Right side of the canvas, clear of the centered game column.
const FOUNTAIN_RIGHT_PX = 200;

// This backdrop now renders inside Stage's fixed 1376x768 canvas (see
// stage.tsx, scene-constants.ts) — exactly the art's own native resolution
// — rather than covering an arbitrary viewport, so the old
// background-size:cover crop is gone; the image renders uncropped at 100%.
// Stage scales the whole canvas uniformly, so pixel values measured here
// (GROUND_TEXTURE_SEAM_Y_PERCENT, FOUNTAIN_RIGHT_PX) now hold at every
// viewport and orientation once tuned against this one 1376x768 reference —
// they just haven't been re-tuned against it live yet (they were previously
// measured against a ~1917px-wide screenshot under the old cover crop).
export function PiazzaBackdrop() {
  const { roundStartToken } = useRoundSignal();

  // Written by useRareEvent, read by useFountainWater/useChurchBells — a
  // plain ref, not React state, so the write is visible to the other two
  // hooks' effects immediately, in the same commit. This only works
  // because of call order: React runs one component's passive effects in
  // the order the hooks were declared, so useRareEvent (declared first)
  // always decides and writes this before the other two run. Don't reorder
  // these three calls.
  const suppressAmbientRef = useRef(false);
  useRareEvent(roundStartToken, suppressAmbientRef);
  const flowingSpouts = useFountainWater(roundStartToken, suppressAmbientRef);
  useChurchBells(roundStartToken, suppressAmbientRef);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Layer 1: the piazza scene itself, rendered uncropped at exactly
          its own native resolution. */}
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: `url(${assetPath("/background/piazza.png")})`,
          backgroundSize: "100% 100%",
          imageRendering: "pixelated",
        }}
      />

      {/* Layer 1.5: ambient drifting clouds — above the static art (whose
          own two clouds don't move), below the scrim so the same warm tint
          washes over them too. */}
      <Clouds />

      {/* Layer 1.6: windows that occasionally light up / open their
          shutters on a round start — see use-window-lights.ts. */}
      <Windows />

      {/* Layer 2: legibility scrim — a soft warm-white glow behind the game
          column so text/pills stay readable over the busy facades, without
          hiding the art at the edges of the screen. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at center, oklch(0.985 0.01 85 / 0.55) 0%, oklch(0.985 0.01 85 / 0) 70%)",
        }}
      />

      {/* Layer 3: the fountain — bottom edge pinned to the ground texture
          seam (see GROUND_TEXTURE_SEAM_Y_PERCENT above), right side of the
          screen, clear of the centered game column. */}
      <div
        className="absolute"
        style={{ right: FOUNTAIN_RIGHT_PX, top: `${GROUND_TEXTURE_SEAM_Y_PERCENT}%`, transform: "translateY(-100%)" }}
      >
        <Fountain width={FOUNTAIN_WIDTH_PX} />
        <FountainWater flowingSpouts={flowingSpouts} width={FOUNTAIN_WIDTH_PX} />
      </div>
    </div>
  );
}
