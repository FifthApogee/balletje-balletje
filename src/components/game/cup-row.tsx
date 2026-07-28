"use client";

import { Cup } from "./cup";
import { TablePlatform } from "@/components/background/table-platform";
import type { CupId, CupJitter, CupLift, GamePhase } from "@/lib/game-types";
import { CUP_HEIGHT, CUP_IDS, ROW_WIDTH } from "@/lib/game-constants";

interface CupRowProps {
  order: CupId[];
  ballCupId: CupId;
  tellCupId: CupId;
  liftedCups: CupLift[];
  cupJitter: Record<CupId, CupJitter>;
  phase: GamePhase;
  onPick: (cupId: CupId) => void;
}

export function CupRow({ order, ballCupId, tellCupId, liftedCups, cupJitter, phase, onPick }: CupRowProps) {
  return (
    <div className="relative" style={{ width: ROW_WIDTH, height: CUP_HEIGHT }}>
      <TablePlatform />

      {CUP_IDS.map((cupId) => {
        const lift = liftedCups.find((entry) => entry.cupId === cupId);
        return (
          <Cup
            key={cupId}
            cupId={cupId}
            slotIndex={order.indexOf(cupId)}
            jitter={cupJitter[cupId]}
            hasBall={cupId === ballCupId}
            hasTell={cupId === tellCupId}
            lifted={lift !== undefined}
            liftStyle={lift?.style ?? "full"}
            clickable={phase === "guessing"}
            onPick={onPick}
          />
        );
      })}
    </div>
  );
}
