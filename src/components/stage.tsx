"use client";

import { useRef, type ReactNode } from "react";
import { useStageScale } from "@/hooks/use-stage-scale";
import { STAGE_HEIGHT_PX, STAGE_WIDTH_PX } from "@/lib/scene-constants";

// Forces the whole game — backdrop and board together — into a single
// fixed 16:9 canvas (matching piazza.png's own native resolution, see
// scene-constants.ts), scaled as one unit to fit any viewport and
// letterboxed on whichever axis doesn't match. This is "Option C" from
// development-plans/first-prototype.md, superseding the previous
// background-size:cover crop, which only ever lined up with the game
// column at the one viewport it was tuned against.
//
// Phones: forced landscape via a pure-CSS 90deg rotate in the
// `(orientation: portrait)` branch of the .stage-rotate rule in
// globals.css — not the Screen Orientation API (poor Safari support, and
// needs a permission/fullscreen dance); just a transform.
//
// No React state of its own beyond the scale factor, no game logic — a
// layout orchestration wrapper, so it lives flat next to
// round-signal-provider.tsx rather than inside components/game/ or
// components/background/.
export function Stage({ children }: { children: ReactNode }) {
  const scalerRef = useRef<HTMLDivElement>(null);
  const scale = useStageScale(scalerRef, STAGE_WIDTH_PX);

  return (
    <div className="stage-viewport">
      <div className="stage-rotate">
        <div className="stage-frame">
          <div ref={scalerRef} className="stage-scaler">
            <div
              className="stage-canvas"
              style={{ width: STAGE_WIDTH_PX, height: STAGE_HEIGHT_PX, transform: `scale(${scale})` }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
