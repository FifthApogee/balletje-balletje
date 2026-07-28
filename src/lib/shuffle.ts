import type { CupId, SwapStep } from "./game-types";

/** Inclusive random integer in [min, max]. */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPair(): SwapStep {
  const slotA = Math.floor(Math.random() * 3);
  const offset = Math.floor(Math.random() * 2) + 1; // 1 or 2
  const slotB = (slotA + offset) % 3;
  return { slotA, slotB };
}

function samePair(a: SwapStep, b: SwapStep): boolean {
  return (
    (a.slotA === b.slotA && a.slotB === b.slotB) ||
    (a.slotA === b.slotB && a.slotB === b.slotA)
  );
}

/** A sequence of pairwise slot swaps. Never repeats the immediately preceding
 * pair, since undoing the last swap visibly cancels itself out. */
export function generateShuffle(swapCount: number): SwapStep[] {
  const steps: SwapStep[] = [];
  let previous: SwapStep | null = null;

  while (steps.length < swapCount) {
    const step = randomPair();
    if (previous && samePair(step, previous)) continue;
    steps.push(step);
    previous = step;
  }

  return steps;
}

export function applySwap(order: CupId[], step: SwapStep): CupId[] {
  const next = [...order];
  [next[step.slotA], next[step.slotB]] = [next[step.slotB], next[step.slotA]];
  return next;
}

/** Folds a whole sequence of swaps at once — used to compute where cups will
 * end up before any of them actually play, e.g. for the tell (see lib/tell.ts). */
export function applySwaps(order: CupId[], steps: SwapStep[]): CupId[] {
  return steps.reduce(applySwap, order);
}
