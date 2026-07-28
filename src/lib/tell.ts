import type { CupId } from "./game-types";

/**
 * The tell — the operator's edge. Deliberately never the ball's own cup, and
 * deliberately computed from a resting SLOT ARRANGEMENT (not cup identity):
 * identity is invisible on screen and untrackable through a shuffle, but a
 * slot arrangement is exactly what's in front of you once the cups stop
 * moving. `order` must be the arrangement the cups will actually be resting
 * in when the operator reads the tell (i.e. computed ahead of time via
 * applySwaps — see use-monte-game.ts), not the live, still-shuffling order.
 *
 * The tell sits 2 slots to the right of the ball, wrapping — equivalently,
 * the ball is always 1 slot to the right of the tell.
 */
export function getTellCupId(order: CupId[], ballCupId: CupId): CupId {
  const ballSlot = order.indexOf(ballCupId);
  const tellSlot = (ballSlot + 2) % order.length;
  return order[tellSlot];
}

// Rim glint — a faint specular highlight at one fixed rim coordinate on the
// tell cup. Single continuous intensity knob (opacity), per CLAUDE.md §4:
// too subtle is a failed trick, too obvious is a busted one. Tune here only.
export const TELL_GLINT_OPACITY = 0.16;
export const TELL_GLINT_SIZE_PX = 10;
export const TELL_GLINT_BLUR_PX = 3;
export const TELL_GLINT_TOP_PX = 6;
export const TELL_GLINT_LEFT_PERCENT = 38;

// Which swap (0-indexed) in the shuffle applies the new round's tell. Not 0
// or right at round start: cups are still at rest during the pre-shuffle
// peek reveal, so swapping the glint onto a different cup right then is a
// bare, static jump anyone would catch. Waiting until a swap already in
// motion masks the switch in the same visual noise as the shuffle itself.
// SWAP_COUNT_MIN (6) guarantees this index always exists.
export const TELL_SWITCH_SWAP_INDEX = 2;
