// Tunable numbers for the drifting-cloud distractor — one place to retune,
// per CLAUDE.md §4 ("Control"). Ambient: runs on its own continuous cycle,
// independent of round starts (unlike the fountain/bells), so it's rolled
// once per page load rather than per round. See lib/cloud.ts for the fleet
// generator and components/background/clouds.tsx for the rendering + CSS
// drift animation.

// How many independent clouds drift at once.
export const CLOUD_COUNT_MIN = 4;
export const CLOUD_COUNT_MAX = 7;

// Each cloud is a small cluster of overlapping puffs (matching the blocky
// puff shapes already baked into piazza.png's two static clouds) — more
// puffs and a bigger scale reads as a bigger cloud.
export const CLOUD_PUFF_COUNT_MIN = 2;
export const CLOUD_PUFF_COUNT_MAX = 4;
export const CLOUD_SCALE_MIN = 0.6;
export const CLOUD_SCALE_MAX = 1.7;

// Base puff size (px, before the cloud's own random scale), and how far a
// puff's own random offset can land from the cloud's center.
export const CLOUD_PUFF_WIDTH_PX = 40;
export const CLOUD_PUFF_HEIGHT_PX = 20;
export const CLOUD_PUFF_OFFSET_RANGE_PX = 22;

// Vertical band the clouds drift within — open sky only, above every
// rooftop and the clocktower's own roofline, so a cloud never renders in
// front of a building it should logically be behind (this layer paints
// above the backdrop image, so it can't go behind anything in it). Halved
// (was 3-24, a 21-point band) at Stefan's request — clouds now stay closer
// to the very top of the frame instead of drifting down toward the roofs.
export const CLOUD_Y_MIN_PERCENT = 3;
export const CLOUD_Y_MAX_PERCENT = 13.5;

// How long one full left-to-right crossing takes. Randomized per cloud, not
// fixed, so speeds vary — combined with each cloud's own random negative
// animation-delay (its starting phase), differing durations naturally drift
// in and out of sync, which is what makes some crossings read as "frequent"
// and others "rare" without any separate spawn-timer logic.
export const CLOUD_DURATION_MS_MIN = 26000;
export const CLOUD_DURATION_MS_MAX = 75000;

// How far off-screen a cloud starts/ends, so even the largest scale is
// fully clear of the canvas edge before/after its crossing.
export const CLOUD_EDGE_MARGIN_PX = 260;

export const CLOUD_COLOR = "#F4F7FB";
export const CLOUD_OPACITY = 0.92;
