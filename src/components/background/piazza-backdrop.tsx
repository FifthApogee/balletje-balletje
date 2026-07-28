"use client";

import { Fountain } from "./fountain";
import { FountainWater } from "./fountain-water";
import { useFountainWater } from "@/hooks/use-fountain-water";
import { useRoundSignal } from "@/hooks/use-round-signal";

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

// Vertical anchor for the "cover" crop, as a CSS background-position
// keyword. The open cobblestone ground is only the bottom ~28% of the
// source image (see scene-constants.ts), so leaning the crop toward the
// bottom keeps the cup row closer to standing on stone instead of floating
// over rooftops. The one knob to retune if the game column's height changes.
const BACKDROP_FOCUS_POSITION = "center 80%";

// Where the detailed cobblestone tiling gives way to the flat, monotone
// grey of the far piazza floor — measured directly off piazza.png (native
// 1376x768): a horizontal seam at y=633px, i.e. 82.4% of the image height.
// The fountain's own bottom edge is placed right on this line, since
// piazza.png no longer has any fountain baked into its art.
const GROUND_TEXTURE_SEAM_Y_PERCENT = 82.4;

const FOUNTAIN_WIDTH_PX = 220;
// Right side of the screen, clear of the centered game column.
const FOUNTAIN_RIGHT_PX = 200;

// Same known caveat as the rest of this file: these are viewport-relative
// percentages/px, while the backdrop image scales via `background-size:
// cover` — so "bottom edge on the seam" holds exactly at the viewport this
// was measured against and drifts at meaningfully different sizes. Deferred
// to the same responsive pass noted elsewhere (see development-plans).
export function PiazzaBackdrop() {
  const { roundStartToken } = useRoundSignal();
  const flowingSpouts = useFountainWater(roundStartToken);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Layer 1: the piazza scene itself. */}
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: "url(/background/piazza.png)",
          backgroundSize: "cover",
          backgroundPosition: BACKDROP_FOCUS_POSITION,
          imageRendering: "pixelated",
        }}
      />

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
