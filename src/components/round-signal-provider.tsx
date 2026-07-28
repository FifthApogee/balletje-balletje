"use client";

import { useCallback, useMemo, useState } from "react";
import { RoundSignalContext } from "@/hooks/use-round-signal";

// Wraps the app (see layout.tsx) so GameBoard and PiazzaBackdrop — siblings,
// not parent/child — can share a single "a round just started" signal
// without lifting either component into the other's tree. See
// hooks/use-round-signal.ts for the context this owns.
export function RoundSignalProvider({ children }: { children: React.ReactNode }) {
  const [roundStartToken, setRoundStartToken] = useState(0);
  const triggerRoundStart = useCallback(() => setRoundStartToken((token) => token + 1), []);
  const value = useMemo(() => ({ roundStartToken, triggerRoundStart }), [roundStartToken, triggerRoundStart]);

  return <RoundSignalContext.Provider value={value}>{children}</RoundSignalContext.Provider>;
}
