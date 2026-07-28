export type CupId = "a" | "b" | "c";

// 'sequencing' covers every scripted, non-interactive lift/close beat that
// plays before a shuffle starts: closing the previous round's cup, revealing
// where the ball actually was (after a wrong guess), and showing the new
// round's starting position.
export type GamePhase = "idle" | "sequencing" | "shuffling" | "guessing" | "revealed";

// How a lifted cup is lifted. "full" is a normal, upright reveal (a picked
// cup, or the ball's cup at a round's start). "tilt" is the wrong-guess
// follow-up beat — same height as "full" but on an angle, so it reads as
// "here's where it actually was" and not as a second guess. "peek" is a
// shallow, non-tilted lift used for cups shown as empty alongside a reveal,
// to prove there's only one ball.
export type LiftStyle = "full" | "tilt" | "peek";

export interface CupLift {
  cupId: CupId;
  style: LiftStyle;
}

export interface SwapStep {
  slotA: number;
  slotB: number;
}

export interface CupJitter {
  x: number;
  y: number;
}

export interface GameSession {
  phase: GamePhase;
  order: CupId[]; // index = slot position
  ballCupId: CupId; // travels with its cup through the shuffle
  // The operator's tell — the cup identity that will be 2 slots right of the
  // ball once the shuffle (and, if it fires, the bonus swap) settles. Set
  // once per round from a precomputed final arrangement, not derived live
  // from `order` — see lib/tell.ts and use-monte-game.ts.
  tellCupId: CupId;
  pickedCupId: CupId | null;
  // Every cup currently showing its underside. Usually 0 or 1, but a wrong
  // guess leaves both the picked cup and the ball's cup up at once.
  liftedCups: CupLift[];
  // Each cup's independent positional offset — a purely visual distraction,
  // re-rolled once per round. See CUP_JITTER_RANGE_PX.
  cupJitter: Record<CupId, CupJitter>;
  score: { wins: number; losses: number };
}
