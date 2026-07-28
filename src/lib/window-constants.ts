// Tunable numbers for the window-light distractor — one place to retune,
// per CLAUDE.md §4 ("Control"). Each window toggles between closed (dark)
// and open-with-light (shutters swung out, warm glow) on round starts — see
// lib/window.ts for the toggle-decision logic and use-window-lights.ts for
// how it's wired to round starts.

export type WindowId = "w1" | "w2" | "w3" | "w4" | "w5";

export interface WindowSpec {
  id: WindowId;
  // Center of the window, as % of the piazza backdrop image (measured by
  // flood-filling the art's dark window rectangles at native resolution —
  // see development-plans/first-prototype.md for the measurement script).
  xPercent: number;
  yPercent: number;
  // The window's own size in px, at the backdrop's native 1376x768.
  widthPx: number;
  heightPx: number;
}

// W1-W4 form one group (see WINDOW_GROUP_IDS / the selection rule in
// lib/window.ts); W5 changes independently.
export const WINDOW_SPECS: WindowSpec[] = [
  { id: "w1", xPercent: 90.6, yPercent: 2.3, widthPx: 16, heightPx: 37 },
  { id: "w2", xPercent: 20.2, yPercent: 18.2, widthPx: 16, heightPx: 45 },
  { id: "w3", xPercent: 81.3, yPercent: 16.3, widthPx: 11, heightPx: 51 },
  { id: "w4", xPercent: 15.4, yPercent: 33.1, widthPx: 24, heightPx: 46 },
  { id: "w5", xPercent: 73.1, yPercent: 41.3, widthPx: 17, heightPx: 45 },
];

export const WINDOW_GROUP_IDS: WindowId[] = ["w1", "w2", "w3", "w4"];
export const WINDOW_INDEPENDENT_ID: WindowId = "w5";

// On a round start: this is the chance *something* in the W1-W4 group
// changes at all. If it hits, one of the four (chosen at random) is
// guaranteed to toggle, and each of the other three independently gets a
// 1-in-3 chance to also toggle.
export const WINDOW_GROUP_CHANGE_CHANCE = 0.75;
export const WINDOW_GROUP_OTHER_CHANGE_CHANCE = 1 / 3;

// W5 toggles independently of the group, on its own chance, every round.
export const WINDOW_INDEPENDENT_CHANGE_CHANCE = 0.25;

// Shutter swing / glow fade timing.
export const WINDOW_TRANSITION_MS = 450;

// Each shutter's own width, as a fraction of its window's width — they sit
// just outside the window (not over it, so there's no need to match the
// art's existing dark window rectangle pixel-for-pixel), swinging out to
// the side via scaleX from the window's edge.
export const WINDOW_SHUTTER_WIDTH_RATIO = 0.55;

export const WINDOW_SHUTTER_COLOR = "#2B1710";
export const WINDOW_GLOW_COLOR = "#FFD98A";
export const WINDOW_GLOW_OPACITY = 0.85;
