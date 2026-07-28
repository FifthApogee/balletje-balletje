"use client";

import { useMonteGame } from "@/hooks/use-monte-game";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AudioControls } from "./audio-controls";
import { CupRow } from "./cup-row";
import { Scoreboard } from "./scoreboard";

// Nudges the whole game column (title, table, cups, controls) down, so the
// table's paws land near the top of the piazza backdrop's cobblestone —
// before it turns solidly grey — rather than floating higher up over the
// buildings. One tunable knob; retune here if the backdrop's focus point
// (piazza-backdrop.tsx) or viewport size changes how this lines up.
const GAME_COLUMN_DROP_PX = 180;

export function GameBoard() {
  const { session, startRound, pickCup, resetScore, audio } = useMonteGame();
  const { phase, order, ballCupId, tellCupId, liftedCups, cupJitter, pickedCupId, score } = session;

  const won = phase === "revealed" && pickedCupId === ballCupId;
  const cupsInMotion = phase === "sequencing" || phase === "shuffling";

  return (
    <div className="flex flex-col items-center">
      {/* Pinned to the canvas corner (Stage, see stage.tsx), not the board —
          deliberately far from the cups, and deliberately not part of the
          column drop below. */}
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <Scoreboard wins={score.wins} losses={score.losses} disabled={cupsInMotion} onReset={resetScore} />
        <AudioControls
          volume={audio.volume}
          muted={audio.muted}
          onVolumeChange={audio.setVolume}
          onToggleMuted={audio.toggleMuted}
        />
        {phase === "revealed" && (
          <p
            className={cn(
              "rounded-full border bg-background/50 px-4 py-1.5 text-sm font-semibold shadow-sm backdrop-blur",
              won ? "border-green-600/40 text-green-600" : "border-red-600/40 text-red-600"
            )}
          >
            {won ? "Correct!" : "Wrong!"}
          </p>
        )}
      </div>

      {/* Pinned at the same top-6 height as the wins/losses pill, centered
          independently of the (dropped, left-pinned) HUD stack above. */}
      <h1 className="absolute top-6 left-1/2 -translate-x-1/2 rounded-full border bg-background/80 px-6 py-2 text-2xl font-semibold shadow-sm backdrop-blur">
        Balletje-balletje
      </h1>

      <div className="flex flex-col items-center" style={{ marginTop: GAME_COLUMN_DROP_PX }}>
        <CupRow
          order={order}
          ballCupId={ballCupId}
          tellCupId={tellCupId}
          liftedCups={liftedCups}
          cupJitter={cupJitter}
          phase={phase}
          onPick={pickCup}
        />
      </div>

      {/* Pinned to the bottom of the canvas, independent of the game
          column's own drop offset above. */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        {phase === "idle" && (
          <Button className="h-16 px-8 text-xl" onClick={startRound}>
            Start
          </Button>
        )}
        {phase === "revealed" && (
          <Button className="h-16 px-8 text-xl" onClick={startRound}>
            Play again
          </Button>
        )}
        {(phase === "sequencing" || phase === "shuffling" || phase === "guessing") && (
          <Button className="h-16 px-8 text-xl" disabled>
            {phase === "guessing" ? "Pick a cup" : phase === "shuffling" ? "Shuffling…" : "Get ready…"}
          </Button>
        )}
      </div>
    </div>
  );
}
