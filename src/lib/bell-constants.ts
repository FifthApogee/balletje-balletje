import { assetPath } from "./asset-path";

// Tunable numbers for the church-bell distractor — one place to retune, per
// CLAUDE.md §4 ("Control"). Audio-only, no sprite: a rare, quiet one-shot
// that fires on some round starts, same "carries zero information about the
// ball" rule as the fountain (rolled independently of ballCupId).

export const BELL_AUDIO_SRC = assetPath("/audios/church-bells.mp3");

// Chance a round start triggers the bell at all.
export const BELL_CHANCE = 0.05;

// Delay after the round starts before the bell rings, so it never lands
// exactly on the click.
export const BELL_DELAY_MS = 500;

export const BELL_VOLUME = 0.6;
