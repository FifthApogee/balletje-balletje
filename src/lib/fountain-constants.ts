// Tunable numbers for the fountain distractor — one place to retune, per
// CLAUDE.md §4 ("Control"). See lib/fountain.ts for the plan algorithm these
// feed, and hooks/use-fountain-water.ts for how the plan gets played out on
// a timeline.

// The fountain's three faucets. "front" is the carved relief facing the
// viewer (see components/background/fountain.tsx) — visually the middle one.
export type FountainSpout = "left" | "right" | "front";
export const FOUNTAIN_SPOUTS: FountainSpout[] = ["left", "right", "front"];

// Half the time, nothing pours at all this round.
export const NO_POUR_CHANCE = 0.5;

// If a previous round's pour is still running when the next round starts,
// this is the chance it's left running untouched instead of being cut short
// and re-rolled.
export const CONTINUE_CHANCE = 0.3;

// Delay after a round starts before the fountain (if it's pouring at all)
// begins its first faucet, so it never lines up exactly with the shuffle.
export const INITIAL_DELAY_MS_MIN = 500;
export const INITIAL_DELAY_MS_MAX = 3000;

// Whole-event bounds: elapsed time from the first faucet's start to the
// last one's stop, across however many faucets are involved.
export const EVENT_DURATION_MS_MIN = 3000;
export const EVENT_DURATION_MS_MAX = 20000;

// Floor on any single faucet's own flow time, so a chosen faucet is never on
// too briefly to register.
export const MIN_FAUCET_FLOW_MS = 800;

// The ambient recording backing every faucet (see hooks/use-fountain-audio.ts).
// One shared clip, played per-faucet from a random offset so repeats don't
// sound identical; playback loops in case a faucet outlasts what's left of it.
export const FOUNTAIN_AUDIO_SRC = "/audios/freesound_community-small-fountain-7073.mp3";
export const FOUNTAIN_AUDIO_CLIP_DURATION_MS = 45000;
export const FOUNTAIN_AUDIO_VOLUME = 0.5;
