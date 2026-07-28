// The piazza backdrop's scene geometry, measured directly off the source
// image (public/background/piazza.png, native 1376x768). Stored as
// percentages so anchors stay correct under any CSS scaling of the image.
// Used today only to position the legibility scrim; the real payoff is
// later, when a piece of the backdrop (e.g. the clock hands) is replaced by
// a live component and needs to land exactly where the art already draws it.

// Where the cobblestone ground meets the buildings — center vs. the raised
// edges (the horizon line sweeps upward toward both sides of the image).
export const HORIZON_Y_CENTER_PERCENT = 72.1;
export const HORIZON_Y_EDGE_PERCENT = 81.9;

// The street's vanishing point, horizontally — dead center, same as the cup
// row already is.
export const VANISHING_POINT_X_PERCENT = 50.1;

// Clock face center on the tower, roughly measured — re-measure precisely
// before building the live clock-hands overlay this is reserved for.
export const CLOCK_CENTER_X_PERCENT = 57;
export const CLOCK_CENTER_Y_PERCENT = 28;

// The fountain is no longer composited into this backdrop image — it's a
// standalone sprite (src/components/background/fountain.tsx), placed on the
// piazza as its own component. Its spout coordinates live there now,
// expressed as percentages of the sprite's own box (FOUNTAIN_LEFT_SPOUT_PERCENT
// / FOUNTAIN_RIGHT_SPOUT_PERCENT), not this scene image.
