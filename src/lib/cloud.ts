import {
  CLOUD_COUNT_MAX,
  CLOUD_COUNT_MIN,
  CLOUD_DURATION_MS_MAX,
  CLOUD_DURATION_MS_MIN,
  CLOUD_PUFF_COUNT_MAX,
  CLOUD_PUFF_COUNT_MIN,
  CLOUD_PUFF_OFFSET_RANGE_PX,
  CLOUD_PUFF_WIDTH_PX,
  CLOUD_PUFF_HEIGHT_PX,
  CLOUD_SCALE_MAX,
  CLOUD_SCALE_MIN,
  CLOUD_Y_MAX_PERCENT,
  CLOUD_Y_MIN_PERCENT,
} from "./cloud-constants";
import { randomInt } from "./shuffle";

export interface CloudPuff {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
}

export interface Cloud {
  id: number;
  topPercent: number;
  scale: number;
  durationMs: number;
  // Negative animation-delay (ms) — offsets each cloud's starting phase so
  // the whole fleet doesn't enter the screen in lockstep on mount.
  delayMs: number;
  puffs: CloudPuff[];
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generatePuffs(count: number): CloudPuff[] {
  const puffs: CloudPuff[] = [{ leftPx: 0, topPx: 0, widthPx: CLOUD_PUFF_WIDTH_PX, heightPx: CLOUD_PUFF_HEIGHT_PX }];
  for (let i = 1; i < count; i++) {
    puffs.push({
      leftPx: randomInt(-CLOUD_PUFF_OFFSET_RANGE_PX, CLOUD_PUFF_OFFSET_RANGE_PX),
      topPx: randomInt(-CLOUD_PUFF_OFFSET_RANGE_PX / 2, CLOUD_PUFF_OFFSET_RANGE_PX / 2),
      widthPx: CLOUD_PUFF_WIDTH_PX * randomFloat(0.6, 1),
      heightPx: CLOUD_PUFF_HEIGHT_PX * randomFloat(0.6, 1),
    });
  }
  return puffs;
}

/**
 * Rolls a fresh independent fleet of drifting clouds — count, per-cloud
 * size/shape, vertical position, and crossing speed all randomized. Pure;
 * see components/background/clouds.tsx for how this gets rendered and
 * animated, and use-cloud-fleet.ts for why it's rolled client-side only.
 */
export function generateCloudFleet(): Cloud[] {
  const count = randomInt(CLOUD_COUNT_MIN, CLOUD_COUNT_MAX);
  return Array.from({ length: count }, (_, id) => ({
    id,
    topPercent: randomFloat(CLOUD_Y_MIN_PERCENT, CLOUD_Y_MAX_PERCENT),
    scale: randomFloat(CLOUD_SCALE_MIN, CLOUD_SCALE_MAX),
    durationMs: randomInt(CLOUD_DURATION_MS_MIN, CLOUD_DURATION_MS_MAX),
    delayMs: -randomInt(0, CLOUD_DURATION_MS_MAX),
    puffs: generatePuffs(randomInt(CLOUD_PUFF_COUNT_MIN, CLOUD_PUFF_COUNT_MAX)),
  }));
}
