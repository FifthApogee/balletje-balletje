import { RARE_EVENT_CHANCE } from "./rare-event-constants";

/**
 * Whether the rare explosion event fires on this round start. Pure — the
 * caller (use-rare-event.ts) owns the "never twice" / "never on the first
 * round" state and passes the relevant flags in.
 */
export function shouldFireRareEvent(opts: { isFirstRound: boolean; alreadyFired: boolean }): boolean {
  if (opts.isFirstRound || opts.alreadyFired) return false;
  return Math.random() < RARE_EVENT_CHANCE;
}
