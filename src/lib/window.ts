import {
  WINDOW_GROUP_CHANGE_CHANCE,
  WINDOW_GROUP_IDS,
  WINDOW_GROUP_OTHER_CHANGE_CHANCE,
  WINDOW_INDEPENDENT_CHANGE_CHANCE,
  WINDOW_INDEPENDENT_ID,
  type WindowId,
} from "./window-constants";
import { randomInt } from "./shuffle";

/**
 * Decides which windows toggle (open<->closed) on a single round start.
 * Pure — no state, no timers; use-window-lights.ts applies the result.
 *
 * W1-W4: WINDOW_GROUP_CHANGE_CHANCE chance that anything in the group
 * changes at all. If it hits, one member (picked at random) is guaranteed
 * to toggle, and each of the other three independently rolls its own
 * WINDOW_GROUP_OTHER_CHANGE_CHANCE (1-in-3) to toggle too.
 *
 * W5: toggles independently, on its own WINDOW_INDEPENDENT_CHANGE_CHANCE,
 * unrelated to the group roll.
 */
export function decideWindowToggles(): WindowId[] {
  const toggled: WindowId[] = [];

  if (Math.random() < WINDOW_GROUP_CHANGE_CHANCE) {
    const guaranteedIndex = randomInt(0, WINDOW_GROUP_IDS.length - 1);
    WINDOW_GROUP_IDS.forEach((id, i) => {
      if (i === guaranteedIndex || Math.random() < WINDOW_GROUP_OTHER_CHANGE_CHANCE) {
        toggled.push(id);
      }
    });
  }

  if (Math.random() < WINDOW_INDEPENDENT_CHANGE_CHANCE) {
    toggled.push(WINDOW_INDEPENDENT_ID);
  }

  return toggled;
}
