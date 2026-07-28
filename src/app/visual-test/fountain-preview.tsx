"use client";

import { useState } from "react";
import { Fountain } from "@/components/background/fountain";
import { FountainWater } from "@/components/background/fountain-water";
import { useFountainWater } from "@/hooks/use-fountain-water";

const FOUNTAIN_PREVIEW_WIDTH_PX = 240;

// Dev-only preview of the round-triggered distractor (see
// use-fountain-water.ts) — same hook the live piazza backdrop uses, just
// driven here by a button instead of real round starts, for eyeballing.
export function FountainPreview() {
  const [roundStartToken, setRoundStartToken] = useState(0);
  const flowingSpouts = useFountainWater(roundStartToken);

  return (
    <div className="relative" style={{ width: FOUNTAIN_PREVIEW_WIDTH_PX }}>
      <Fountain width={FOUNTAIN_PREVIEW_WIDTH_PX} />
      <FountainWater flowingSpouts={flowingSpouts} width={FOUNTAIN_PREVIEW_WIDTH_PX} />
      <p className="mt-2 text-center text-xs text-zinc-500">
        left: {flowingSpouts.left ? "on" : "off"} · right: {flowingSpouts.right ? "on" : "off"} · front:{" "}
        {flowingSpouts.front ? "on" : "off"}
      </p>
      <button
        type="button"
        className="mt-2 w-full rounded border border-zinc-300 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
        onClick={() => setRoundStartToken((token) => token + 1)}
      >
        Simulate round start
      </button>
    </div>
  );
}
