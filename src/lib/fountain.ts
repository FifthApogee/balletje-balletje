import {
  EVENT_DURATION_MS_MAX,
  EVENT_DURATION_MS_MIN,
  FOUNTAIN_AUDIO_CLIP_DURATION_MS,
  FOUNTAIN_SPOUTS,
  MIN_FAUCET_FLOW_MS,
  NO_POUR_CHANCE,
  type FountainSpout,
} from "./fountain-constants";
import { randomInt } from "./shuffle";

export interface FountainPourEvent {
  spout: FountainSpout;
  startMs: number; // relative to the plan's own start, i.e. after the initial delay
  stopMs: number;
  audioOffsetMs: number; // where into the shared clip this faucet's playback starts
}

export interface FountainPlan {
  events: FountainPourEvent[]; // empty = no pour this round
}

function shuffledSpouts(): FountainSpout[] {
  const pool = [...FOUNTAIN_SPOUTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/**
 * Rolls this round's fountain distractor: whether it pours at all, how many
 * of the three faucets, in what order they start, and how long each runs.
 * Pure and self-contained — see use-fountain-water.ts for how the result
 * gets scheduled against real timers and playback.
 */
export function generateFountainPlan(): FountainPlan {
  if (Math.random() < NO_POUR_CHANCE) return { events: [] };

  const faucetCount = randomInt(1, FOUNTAIN_SPOUTS.length);
  // The random order `chosen` ends up in doubles as the "who starts first"
  // order — no separate ordering step needed.
  const chosen = shuffledSpouts().slice(0, faucetCount);
  const eventDurationMs = randomInt(EVENT_DURATION_MS_MIN, EVENT_DURATION_MS_MAX);
  const latestStartMs = Math.max(0, eventDurationMs - MIN_FAUCET_FLOW_MS);

  // Start offsets: the first-chosen faucet always starts at 0 (right when
  // the plan's own initial delay elapses); the rest land at random points,
  // sorted ascending so index i keeps lining up with chosen[i]'s turn.
  const startOffsets = chosen
    .map((_, i) => (i === 0 ? 0 : randomInt(0, latestStartMs)))
    .sort((a, b) => a - b);

  const events: FountainPourEvent[] = chosen.map((spout, i) => {
    const startMs = startOffsets[i];
    const minStopMs = startMs + MIN_FAUCET_FLOW_MS;
    // The last-starting faucet always closes the event out exactly at
    // eventDurationMs, so the realized total stays inside the 3-30s bound;
    // everyone else stops randomly, independently, somewhere before that.
    const stopMs = i === chosen.length - 1 ? eventDurationMs : randomInt(Math.min(minStopMs, eventDurationMs), eventDurationMs);
    const audioOffsetMs = randomInt(0, Math.max(0, FOUNTAIN_AUDIO_CLIP_DURATION_MS - MIN_FAUCET_FLOW_MS));
    return { spout, startMs, stopMs: Math.max(stopMs, minStopMs), audioOffsetMs };
  });

  return { events };
}
