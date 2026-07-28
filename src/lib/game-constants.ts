import { assetPath } from "./asset-path";
import type { CupId } from "./game-types";

export const CUP_IDS: CupId[] = ["a", "b", "c"];

// Shuffle pacing — tune these at Pause B once the animation is visible.
// Swap count and swap interval are each randomized per round within these
// bounds (rather than fixed), so no two shuffles feel identical.
export const SWAP_COUNT_MIN = 6;
export const SWAP_COUNT_MAX = 10;
// Kept a notch below SWAP_INTERVAL_MS_MIN so even the fastest randomized
// swap finishes its slide before the next one starts (else cups teleport).
export const SWAP_DURATION_MS = 230;
export const SWAP_INTERVAL_MS_MIN = 250;
export const SWAP_INTERVAL_MS_MAX = 380;

// Pre-shuffle reveal choreography (starting position / wrong-guess reveal).
export const REVEAL_DURATION_MS = 1000; // how long a lifted cup stays up
export const LIFT_TRANSITION_MS = 300; // the lift/close animation itself

// Lift heights, as a translateY percentage of the cup face's own height.
// "full" is the standard open reveal (a picked cup, or the ball's cup at a
// round's start). "tilt" is the wrong-guess "here's where it actually was"
// beat — same height as "full" but on an angle, so it reads as a peek and
// not a second guess. "peek" is a shallow, non-tilted lift — half of "full"
// — used for cups being shown as empty alongside the real reveal, to prove
// there's only one ball.
export const FULL_LIFT_PERCENT = -70;
export const TILT_LIFT_PERCENT = -70;
export const TILT_ROTATION_DEG = -22;
export const PEEK_LIFT_PERCENT = FULL_LIFT_PERCENT / 2;

// Cup/slot geometry, in pixels.
export const CUP_WIDTH = 120;
export const CUP_HEIGHT = 140;
export const CUP_GAP = 32;
export const SLOT_WIDTH = CUP_WIDTH + CUP_GAP;
export const ROW_WIDTH = CUP_WIDTH * CUP_IDS.length + CUP_GAP * (CUP_IDS.length - 1);
export const BALL_SIZE = 28;

// The floor line under the cups — extends this many pixels past the row on
// each side (widened 20%, twice: 24 -> 29 -> 35).
export const FLOOR_OVERHANG = 35;

// Per-cup positional jitter: each cup gets its own small, independent random
// offset so the row doesn't sit in a perfectly even line — re-rolled on
// every swap during the shuffle (not just once per round), so no cup keeps
// a stable "wobble fingerprint" that could be used to track it through the
// shuffle. X can go either direction (left/right on the table). Y is drawn
// from [CUP_JITTER_Y_MIN, CUP_JITTER_RANGE_PX] and always applied as a lift
// (see cup.tsx) — never 0, so a cup's base never sits exactly on the floor
// line and covers it, and never forward past the table's front edge either.
// Range lowered (was 9) so the upward wobble never lifts a cup far enough to
// look like it's floating above the table's top face.
export const CUP_JITTER_RANGE_PX = 5;
export const CUP_JITTER_Y_MIN = 2;

// Pulls the cups down toward the table's top face, closer than their default
// bottom-of-row resting position — tuned live against TablePlatform once its
// own placement was finalized.
export const CUP_TABLE_OVERLAP_PX = 10;

// Occasionally, after the shuffle stops and the player is already looking
// at the cups, one more swap sneaks in — a rare extra twist.
export const BONUS_SWAP_CHANCE = 0.1; // 10% of rounds
export const BONUS_SWAP_DELAY_MS_MIN = 1200;
export const BONUS_SWAP_DELAY_MS_MAX = 2000;

// Swoosh sound clips played on cup swaps. `durationMs` is each clip's own
// natural length (rough-trimmed, not frame-exact) — used to compute a
// playbackRate that stretches/compresses it toward the swap's actual pacing.
// One random clip plays per swap (not per cup — a fixed per-cup sound would
// let anyone listening, not just the operator, track a cup by ear through
// the shuffle, the same bug already fixed for jitter).
export interface SwooshClip {
  src: string;
  durationMs: number;
}

export const SWOOSH_CLIPS: SwooshClip[] = [
  { src: assetPath("/audios/swoosh-1.mp3"), durationMs: 610 },
  { src: assetPath("/audios/swoosh-2.mp3"), durationMs: 675 },
  { src: assetPath("/audios/swoosh-3.mp3"), durationMs: 136 },
  { src: assetPath("/audios/swoosh-4.mp3"), durationMs: 644 },
  { src: assetPath("/audios/swoosh-5.mp3"), durationMs: 413 },
  { src: assetPath("/audios/swoosh-6.mp3"), durationMs: 286 },
];

// Reserved for the rare bonus swap only — it's the longest clip, and the
// bonus swap plays alone (no swap immediately follows it), so it's the one
// case that can afford to play at its natural length instead of being
// stretched to fit a fast-paced swap.
export const BONUS_SWOOSH_CLIP: SwooshClip = {
  src: assetPath("/audios/swoosh-bonus.mp3"),
  durationMs: 780,
};

// Default swoosh playback volume (0–1) and mute state. Not maxed by
// default — this plays over a laptop/phone speaker at a live table, and
// 100% risks distortion and startling everyone; 0.7 stays clearly audible
// with headroom. Adjustable in-game via the audio controls pill.
export const DEFAULT_SWOOSH_VOLUME = 0.7;
