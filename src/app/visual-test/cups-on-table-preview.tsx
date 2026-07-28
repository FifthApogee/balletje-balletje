"use client";

import { useState } from "react";
import { TablePlatform } from "@/components/background/table-platform";
import { CUP_HEIGHT, CUP_IDS, ROW_WIDTH, SLOT_WIDTH } from "@/lib/game-constants";

// Dev-only: lets Stefan drag a slider to see how a vertical nudge on the cup
// row changes where the cups sit relative to the table's top face. The
// number this settles on is what CupRow's own wrapper (or its caller) should
// be offset by in the real game — see the comment this hands back on-page.
const NUDGE_RANGE_PX = 40;

// A static, non-interactive cup — no jitter, no lift, no click handling.
// Same box model as the real Cup (game/cup.tsx) so it lines up with
// TablePlatform exactly the way the real CupRow does, just without wiring in
// the full game hook for a one-off visual check.
function StaticCup({ slotIndex }: { slotIndex: number }) {
  return (
    <div
      className="absolute bottom-0"
      style={{ width: 120, height: CUP_HEIGHT, transform: `translateX(${slotIndex * SLOT_WIDTH}px)` }}
    >
      <div
        className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-amber-500 to-amber-700 shadow-md [clip-path:polygon(22%_0%,78%_0%,100%_100%,0%_100%)]"
        style={{ height: CUP_HEIGHT - 20 }}
      />
    </div>
  );
}

export function CupsOnTablePreview() {
  const [nudgePx, setNudgePx] = useState(0);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-zinc-500">Cups on table — adjust to find the right resting offset</p>

      <div
        className="relative bg-cover bg-[center_80%] p-4"
        style={{ backgroundImage: "url(/background/piazza.png)", imageRendering: "pixelated" }}
      >
        <div
          className="relative"
          style={{ width: ROW_WIDTH, height: CUP_HEIGHT, transform: `translateY(${nudgePx}px)` }}
        >
          <TablePlatform />
          {CUP_IDS.map((cupId, i) => (
            <StaticCup key={cupId} slotIndex={i} />
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm text-zinc-600">
        Vertical nudge: {nudgePx}px
        <input
          type="range"
          min={-NUDGE_RANGE_PX}
          max={NUDGE_RANGE_PX}
          value={nudgePx}
          onChange={(e) => setNudgePx(Number(e.target.value))}
        />
      </label>

      <p className="max-w-md text-center text-xs text-zinc-500">
        Cups and table already move together (TablePlatform is anchored inside CupRow&apos;s own box, so
        it always tracks the cups). This slider previews adding a translateY nudge to that shared box.
        Whatever value looks right here is what to put in CupRow — see the code comment.
      </p>
    </div>
  );
}
