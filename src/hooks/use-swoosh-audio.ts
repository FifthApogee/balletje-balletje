"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BONUS_SWOOSH_CLIP, DEFAULT_SWOOSH_VOLUME, SWOOSH_CLIPS, type SwooshClip } from "@/lib/game-constants";

const ALL_CLIPS = [...SWOOSH_CLIPS, BONUS_SWOOSH_CLIP];

// Keeps a stretched clip from turning into an obvious chipmunk/slow-mo
// effect when its natural length is far from the target — the tail is
// allowed to run past the next swap's start instead, which just reads as
// overlapping shuffle noise.
const MIN_PLAYBACK_RATE = 0.75;
const MAX_PLAYBACK_RATE = 1.4;

export interface SwooshPlan {
  clip: SwooshClip;
  playbackRate: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Owns the swoosh sound effects: preloads every clip once up front, and lets
 * the caller precompute a "plan" (which clip, what rate) ahead of time so
 * playback itself is just "play this now" with no work on the timer path.
 * Real `Audio` elements are a side effect, so this lives in hooks/, not lib/.
 */
export function useSwooshAudio() {
  const elementsRef = useRef<Map<string, HTMLAudioElement> | null>(null);

  // Refs mirror the state below so `play()` always reads the current value
  // at call time, even from a timer closure captured earlier in the round —
  // otherwise a volume/mute change wouldn't take effect until next round.
  const volumeRef = useRef(DEFAULT_SWOOSH_VOLUME);
  const mutedRef = useRef(false);
  const [volume, setVolumeState] = useState(DEFAULT_SWOOSH_VOLUME);
  const [muted, setMutedState] = useState(false);

  const getElements = useCallback(() => {
    if (elementsRef.current === null) {
      const map = new Map<string, HTMLAudioElement>();
      for (const clip of ALL_CLIPS) {
        const audio = new Audio(clip.src);
        audio.preload = "auto";
        map.set(clip.src, audio);
      }
      elementsRef.current = map;
    }
    return elementsRef.current;
  }, []);

  // Preload as soon as the game mounts, rather than on first play, so the
  // very first swoosh doesn't pay a decode-latency cost mid-shuffle.
  useEffect(() => {
    getElements();
  }, [getElements]);

  // `excludeSrc` keeps the same clip from playing twice in a row within a
  // shuffle — clips can repeat elsewhere in the sequence, just not adjacently.
  const planRandomSwoosh = useCallback((targetDurationMs: number, excludeSrc?: string): SwooshPlan => {
    const candidates = excludeSrc ? SWOOSH_CLIPS.filter((clip) => clip.src !== excludeSrc) : SWOOSH_CLIPS;
    const clip = candidates[Math.floor(Math.random() * candidates.length)];
    return { clip, playbackRate: clamp(clip.durationMs / targetDurationMs, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE) };
  }, []);

  const planBonusSwoosh = useCallback((): SwooshPlan => {
    return { clip: BONUS_SWOOSH_CLIP, playbackRate: 1 };
  }, []);

  const play = useCallback(
    (plan: SwooshPlan) => {
      const audio = getElements().get(plan.clip.src);
      if (!audio) return;
      audio.currentTime = 0;
      audio.playbackRate = plan.playbackRate;
      audio.volume = volumeRef.current;
      audio.muted = mutedRef.current;
      audio.play().catch((err) => console.error("swoosh playback failed", err));
    },
    [getElements]
  );

  const setVolume = useCallback((next: number) => {
    volumeRef.current = next;
    setVolumeState(next);
  }, []);

  const toggleMuted = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMutedState(next);
  }, []);

  return { planRandomSwoosh, planBonusSwoosh, play, volume, setVolume, muted, toggleMuted };
}
