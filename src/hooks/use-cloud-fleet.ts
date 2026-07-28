"use client";

import { useEffect, useState } from "react";
import { generateCloudFleet, type Cloud } from "@/lib/cloud";

// Rolled once on mount, client-side only — never during the server/static
// prerender, which would bake one random fleet into the exported static
// HTML and then produce a different one on client hydration (a mismatch).
// Same rationale as initialSession() in use-monte-game.ts. Deliberately not
// re-rolled on round starts (unlike the fountain/bells) — the clouds drift
// on their own continuous cycle, independent of the game entirely.
export function useCloudFleet(): Cloud[] {
  const [clouds, setClouds] = useState<Cloud[]>([]);

  useEffect(() => {
    // Client-only, deliberately: generating the fleet during render (even
    // via useState's lazy initializer) would run once at static-export
    // build time and again at client hydration, producing two different
    // random fleets and a hydration mismatch — same rationale as
    // initialSession() in use-monte-game.ts. There's no external system to
    // subscribe to here, just a one-time randomize-after-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClouds(generateCloudFleet());
  }, []);

  return clouds;
}
