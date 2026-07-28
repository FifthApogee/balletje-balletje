import { assetPath } from "./asset-path";

// The rare "explosion" event — an easter egg, not a core game feature. See
// use-rare-event.ts for the sequencing and hooks/use-fountain-water.ts /
// use-church-bells.ts for the suppression this triggers on the ambient
// fountain/bell distractors (they can't fire the same round this does).

// Chance a round start triggers the event at all (once eligible — see
// RARE_EVENT_START_DELAY_MS below and use-rare-event.ts for the "not on the
// first round, never twice" rules). THE tunable to bump up while testing —
// e.g. set to 1 to force it on the next eligible round start, then put it
// back.
export const RARE_EVENT_CHANCE = 0.05;

// Delay after the round-start click before the explosion fires.
export const RARE_EVENT_START_DELAY_MS = 1000;

// Total length of the whole event, from the explosion's own start to
// everything going silent again.
export const RARE_EVENT_TOTAL_DURATION_MS = 10000;

// How long after the explosion starts before the radio chatter and police
// siren both begin, together, as a fraction of the total event length —
// kept as a ratio (not an absolute ms value) so it automatically rescales
// if RARE_EVENT_TOTAL_DURATION_MS is ever retuned again, instead of quietly
// throwing off the siren's rise/fall balance below. Explosion.mp3 is a
// short, sub-2s hit — this leaves a beat for it to land before the
// aftermath sounds arrive; not measured frame-exact (same "rough-trim"
// tolerance as the swoosh clips), safe to nudge if the actual clip feels
// off against it.
export const EXPLOSION_TO_SIRENS_DELAY_RATIO = 0.1;
export const EXPLOSION_TO_SIRENS_DELAY_MS = Math.round(RARE_EVENT_TOTAL_DURATION_MS * EXPLOSION_TO_SIRENS_DELAY_RATIO);

// Where in its own active window (explosion-to-sirens start, through to the
// end of RARE_EVENT_TOTAL_DURATION_MS) the siren hits peak volume before
// falling back off — 0.5 = rise and fall take exactly equally long, however
// long that active window ends up being once the two constants above are
// retuned. Not something that needs its own rescaling: a fraction of the
// active window rather than an absolute ms value.
export const SIREN_PEAK_FRACTION = 0.25;
export const SIREN_VOLUME_START = 0.1;
export const SIREN_VOLUME_PEAK = 0.75;
export const SIREN_VOLUME_END = 0.1;
// How often the siren's volume gets nudged along its rise/fall ramp — a
// plain HTMLAudioElement has no built-in ramp API (this app uses no Web
// Audio nodes anywhere), so it's stepped on an interval instead. Lowered
// from 100 to 50 for a visibly smoother, more even-feeling ramp.
export const SIREN_RAMP_INTERVAL_MS = 25;

export const EXPLOSION_AUDIO_SRC = assetPath("/audios/Explosion.mp3");
export const EXPLOSION_VOLUME = 1;
export const RADIO_CHATTER_AUDIO_SRC = assetPath("/audios/radio-chatter.mp3");
export const RADIO_CHATTER_VOLUME = 0.5;
export const POLICE_SIREN_AUDIO_SRC = assetPath("/audios/police-siren.mp3");
