"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioControlsProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMuted: () => void;
}

export function AudioControls({ volume, muted, onVolumeChange, onToggleMuted }: AudioControlsProps) {
  return (
    <div className="flex items-center gap-3 rounded-full border bg-background/50 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={muted ? "Unmute sound" : "Mute sound"}
        aria-pressed={muted}
        onClick={onToggleMuted}
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </Button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        disabled={muted}
        onChange={(event) => onVolumeChange(Number(event.target.value))}
        aria-label="Sound volume"
        className="h-1.5 w-24 cursor-pointer accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
