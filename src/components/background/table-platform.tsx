"use client";

import type { CSSProperties } from "react";
import { FLOOR_OVERHANG } from "@/lib/game-constants";

// The table the cups sit on — purely decorative, no game state or logic,
// so it lives here next to piazza-backdrop.tsx rather than in
// src/components/game/ (see CLAUDE.md §4 architecture boundaries).
// Own small set of tunables here (same pattern as piazza-backdrop.tsx),
// since none of this is gameplay-relevant. Flat color bands rather than a
// gradient: a blocky, hard-edged bevel reads closer to the pixel-art
// backdrop than a smooth 3D shade would.
//
// Depth comes from TOP_FACE: a trapezoid, narrower along its far (top) edge
// than its near (bottom) edge — the same convergence-toward-center trick
// the backdrop's own buildings use for their rooflines (they all narrow
// toward the piazza's vanishing point, which the table is already centered
// under). The narrower back edge reads as "receding into the screen"
// exactly like the buildings do, rather than a flat 2D fascia.
const TABLE_TOP_DEPTH_PX = 20;
const TABLE_TOP_INSET_PERCENT = 15; // how much the far (top) edge narrows in
const TABLE_FRONT_HEIGHT_PX = 40;
const TABLE_SHADOW_HEIGHT_PX = 3;

const TABLE_TOP_COLOR = "#8B5A46";
const TABLE_FACE_COLOR = "#3A1B14";
const TABLE_SHADOW_COLOR = "#1D0F09";

const LEG_COLOR = "#170B07";
const LEG_WIDTH_PX = 26;
const LEG_HEIGHT_PX = 126;
const LEG_TOE_SIZE_PX = 10;
// Only this many px tuck up behind the table's bottom edge, for a clean
// attachment point — the rest of the leg (previously up to 15% of its own
// height, including the toes) now hangs fully visible below the table
// instead of overlapping into the front face.
const LEG_ATTACH_OVERLAP_PX = 20;

// Front legs — full length, wide stance near the table's outer edges.
const LEG_FRONT_INSET_PERCENT = 14;
// Back legs — shorter (simulating distance) and set closer to center, same
// convergence idea as the top face's own narrower far edge. Rendered first
// (behind, in DOM order) so the front legs paint over them where they'd
// overlap, same as a real table's back legs would be partly hidden.
const LEG_BACK_INSET_PERCENT = 28;
const LEG_BACK_LENGTH_PERCENT = 75;

function Leg({ style, heightPx }: { style: CSSProperties; heightPx: number }) {
  const wrapperHeight = heightPx + LEG_TOE_SIZE_PX;
  return (
    <div
      className="absolute"
      style={{
        bottom: -(wrapperHeight - LEG_ATTACH_OVERLAP_PX),
        width: LEG_WIDTH_PX,
        height: wrapperHeight,
        ...style,
      }}
    >
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
        style={{ width: LEG_WIDTH_PX, height: heightPx, backgroundColor: LEG_COLOR }}
      />
      {[-1, 0, 1].map((i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: LEG_TOE_SIZE_PX,
            height: LEG_TOE_SIZE_PX,
            backgroundColor: LEG_COLOR,
            top: 0,
            left: `calc(50% + ${i * (LEG_TOE_SIZE_PX + 2)}px - ${LEG_TOE_SIZE_PX / 2}px)`,
          }}
        />
      ))}
    </div>
  );
}

const TOTAL_HEIGHT_PX = TABLE_TOP_DEPTH_PX + TABLE_FRONT_HEIGHT_PX + TABLE_SHADOW_HEIGHT_PX;

export function TablePlatform() {
  return (
    <div
      className="absolute"
      style={{
        left: -FLOOR_OVERHANG,
        right: -FLOOR_OVERHANG,
        bottom: -TOTAL_HEIGHT_PX,
        height: TOTAL_HEIGHT_PX,
      }}
    >
      <Leg style={{ left: `${LEG_BACK_INSET_PERCENT}%` }} heightPx={LEG_HEIGHT_PX * (LEG_BACK_LENGTH_PERCENT / 100)} />
      <Leg style={{ right: `${LEG_BACK_INSET_PERCENT}%` }} heightPx={LEG_HEIGHT_PX * (LEG_BACK_LENGTH_PERCENT / 100)} />

      {/* Top face — recedes into the screen; the cut corners outside the
          polygon deliberately show the backdrop through, same as the gap
          beside a building's angled roofline. */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: TABLE_TOP_DEPTH_PX,
          backgroundColor: TABLE_TOP_COLOR,
          clipPath: `polygon(${TABLE_TOP_INSET_PERCENT}% 0%, ${100 - TABLE_TOP_INSET_PERCENT}% 0%, 100% 100%, 0% 100%)`,
        }}
      />
      <div
        className="absolute inset-x-0"
        style={{
          top: TABLE_TOP_DEPTH_PX,
          bottom: TABLE_SHADOW_HEIGHT_PX,
          backgroundColor: TABLE_FACE_COLOR,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: TABLE_SHADOW_HEIGHT_PX, backgroundColor: TABLE_SHADOW_COLOR }}
      />

      <Leg style={{ left: `${LEG_FRONT_INSET_PERCENT}%` }} heightPx={LEG_HEIGHT_PX} />
      <Leg style={{ right: `${LEG_FRONT_INSET_PERCENT}%` }} heightPx={LEG_HEIGHT_PX} />
    </div>
  );
}
