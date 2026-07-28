"use client";

import { cn } from "@/lib/utils";
import type { CupId, CupJitter, LiftStyle } from "@/lib/game-types";
import {
  BALL_SIZE,
  CUP_HEIGHT,
  CUP_TABLE_OVERLAP_PX,
  CUP_WIDTH,
  FULL_LIFT_PERCENT,
  LIFT_TRANSITION_MS,
  PEEK_LIFT_PERCENT,
  SLOT_WIDTH,
  SWAP_DURATION_MS,
  TILT_LIFT_PERCENT,
  TILT_ROTATION_DEG,
} from "@/lib/game-constants";
import { TELL_GLINT_BLUR_PX, TELL_GLINT_LEFT_PERCENT, TELL_GLINT_OPACITY, TELL_GLINT_SIZE_PX, TELL_GLINT_TOP_PX } from "@/lib/tell";

interface CupProps {
  cupId: CupId;
  slotIndex: number;
  jitter: CupJitter;
  hasBall: boolean;
  hasTell: boolean;
  lifted: boolean;
  liftStyle: LiftStyle;
  clickable: boolean;
  onPick: (cupId: CupId) => void;
}

export function Cup({ cupId, slotIndex, jitter, hasBall, hasTell, lifted, liftStyle, clickable, onPick }: CupProps) {
  const liftTransform = !lifted
    ? "translateY(0)"
    : liftStyle === "tilt"
      ? `translateY(${TILT_LIFT_PERCENT}%) rotate(${TILT_ROTATION_DEG}deg)`
      : liftStyle === "peek"
        ? `translateY(${PEEK_LIFT_PERCENT}%)`
        : `translateY(${FULL_LIFT_PERCENT}%)`;
  return (
    <button
      type="button"
      onClick={() => clickable && onPick(cupId)}
      disabled={!clickable}
      aria-label={`cup-${cupId}`}
      className={cn("absolute bottom-0", clickable ? "cursor-pointer" : "cursor-default")}
      style={{
        width: CUP_WIDTH,
        height: CUP_HEIGHT,
        // The jitter offset is a purely visual per-cup wobble — composed
        // into the same slot-position transform so it moves and transitions
        // together with the cup, never affecting its slot index. jitter.y
        // is a positive magnitude and is negated here so it only ever moves
        // the cup further back on the table, never toward the viewer past
        // the table's front edge.
        transform: `translateX(${slotIndex * SLOT_WIDTH + jitter.x}px) translateY(${-jitter.y + CUP_TABLE_OVERLAP_PX}px)`,
        transition: `transform ${SWAP_DURATION_MS}ms ease-in-out`,
      }}
    >
      {hasBall && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-100"
          style={{ width: BALL_SIZE, height: BALL_SIZE }}
        />
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-b from-amber-500 to-amber-700 shadow-md",
          "[clip-path:polygon(22%_0%,78%_0%,100%_100%,0%_100%)]"
        )}
        style={{
          height: CUP_HEIGHT - 20,
          transform: liftTransform,
          transformOrigin: "bottom left",
          transition: `transform ${LIFT_TRANSITION_MS}ms ease-out`,
        }}
      >
        {/* The tell — a fixed-coordinate rim highlight, on the tell cup only. */}
        {hasTell && (
          <div
            className="absolute rounded-full bg-white pointer-events-none"
            style={{
              top: TELL_GLINT_TOP_PX,
              left: `${TELL_GLINT_LEFT_PERCENT}%`,
              width: TELL_GLINT_SIZE_PX,
              height: TELL_GLINT_SIZE_PX,
              opacity: TELL_GLINT_OPACITY,
              filter: `blur(${TELL_GLINT_BLUR_PX}px)`,
            }}
          />
        )}
      </div>
    </button>
  );
}
