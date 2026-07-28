"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { BELL_AUDIO_SRC, BELL_CHANCE, BELL_DELAY_MS, BELL_VOLUME } from "@/lib/bell-constants";

// Rare one-shot church-bell distractor, tied to round starts (see
// use-round-signal.ts) same as the fountain. Audio only — no visual
// component, so this is called directly for its side effect rather than
// rendering anything. Side effect (a real Audio element + a timer), so
// hooks/, not lib/.
export function useChurchBells(roundStartToken: number, suppressAmbientRef: RefObject<boolean>): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The effect below fires once on mount (React always runs a fresh effect
  // once) even though no round has actually started yet — skip that one so
  // the bell can't ring before the first real startRound() call, same
  // rationale as use-fountain-water.ts's isInitialMountRef.
  const isInitialMountRef = useRef(true);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(BELL_AUDIO_SRC);
      audioRef.current.preload = "auto";
      audioRef.current.volume = BELL_VOLUME;
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (timerRef.current !== null) clearTimeout(timerRef.current);

    // The rare explosion event (use-rare-event.ts) takes over the scene
    // entirely on the round it fires — no bell that round. That hook runs
    // first (see piazza-backdrop.tsx) and sets this synchronously before
    // this effect runs, in the same commit.
    if (suppressAmbientRef.current) return;
    if (Math.random() >= BELL_CHANCE) return;

    timerRef.current = setTimeout(() => {
      getAudio()
        .play()
        .catch((err) => console.error("church bell playback failed", err));
    }, BELL_DELAY_MS);
    // roundStartToken is the only real trigger here — getAudio is stable
    // across renders (useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundStartToken]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);
}
