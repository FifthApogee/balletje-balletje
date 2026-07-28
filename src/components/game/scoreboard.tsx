"use client";

import { Button } from "@/components/ui/button";

interface ScoreboardProps {
  wins: number;
  losses: number;
  disabled: boolean;
  onReset: () => void;
}

export function Scoreboard({ wins, losses, disabled, onReset }: ScoreboardProps) {
  return (
    <div className="flex items-center gap-3 rounded-full border bg-background/50 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
      <span>Wins: {wins}</span>
      <span>Losses: {losses}</span>
      <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onReset}>
        Reset score
      </Button>
    </div>
  );
}
