"use client";

import { useCloudFleet } from "@/hooks/use-cloud-fleet";
import { CLOUD_COLOR, CLOUD_EDGE_MARGIN_PX, CLOUD_OPACITY } from "@/lib/cloud-constants";

// Ambient drifting clouds, layered above the static piazza art (which has
// its own two baked-in, motionless clouds) — purely decorative, no game
// state, same rationale as the rest of components/background/ (CLAUDE.md
// §4). Each cloud is one CSS animation (see the `.cloud-drift` keyframe in
// globals.css) that loops forever on its own once started — no timers, no
// per-frame JS. The randomized fleet (count, size, vertical position,
// crossing speed) is generated once per page load by useCloudFleet and
// never touched again; this runs independently of the game entirely,
// unlike the fountain/bells which reroll on every round start.
export function Clouds() {
  const clouds = useCloudFleet();

  return (
    <div className="absolute inset-0 overflow-hidden">
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="cloud-drift absolute"
          style={{
            top: `${cloud.topPercent}%`,
            left: -CLOUD_EDGE_MARGIN_PX,
            animationDuration: `${cloud.durationMs}ms`,
            animationDelay: `${cloud.delayMs}ms`,
          }}
        >
          <div style={{ transform: `scale(${cloud.scale})` }}>
            {cloud.puffs.map((puff, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: puff.leftPx,
                  top: puff.topPx,
                  width: puff.widthPx,
                  height: puff.heightPx,
                  backgroundColor: CLOUD_COLOR,
                  opacity: CLOUD_OPACITY,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
