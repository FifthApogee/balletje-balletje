"use client";

import { createContext, useContext } from "react";

// Bridges use-monte-game.ts to purely-decorative scene pieces mounted
// outside the game's own component tree (PiazzaBackdrop's fountain lives in
// layout.tsx, a sibling of GameBoard, not a descendant) — see
// components/round-signal-provider.tsx for the Provider this pairs with.
// Deliberately just a signal, not shared state: fountain behavior does not
// belong in GameSession (CLAUDE.md §4 keeps that one object to real game
// state), it just needs to know when a round starts.
export interface RoundSignal {
  // Bumped once per startRound() call, including the very first. Consumers
  // watch this value change, not what it equals.
  roundStartToken: number;
  triggerRoundStart: () => void;
}

export const RoundSignalContext = createContext<RoundSignal | null>(null);

export function useRoundSignal(): RoundSignal {
  const context = useContext(RoundSignalContext);
  if (!context) {
    throw new Error("useRoundSignal must be used within a RoundSignalProvider");
  }
  return context;
}
