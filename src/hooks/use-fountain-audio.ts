"use client";

import { useCallback, useRef } from "react";
import { FOUNTAIN_AUDIO_SRC, FOUNTAIN_AUDIO_VOLUME, type FountainSpout } from "@/lib/fountain-constants";

/**
 * Owns fountain playback: one real `Audio` element per faucet (not one
 * shared instance) so overlapping faucets layer independently, each started
 * from its own random offset into the shared ~45s clip. Loops per element in
 * case a faucet's flow outlasts what's left of the clip from its offset.
 * Side effect (real `Audio` elements), so hooks/, not lib/ — same rationale
 * as use-swoosh-audio.ts.
 */
export function useFountainAudio() {
  const elementsRef = useRef<Map<FountainSpout, HTMLAudioElement> | null>(null);

  const getElement = useCallback((spout: FountainSpout): HTMLAudioElement => {
    if (elementsRef.current === null) elementsRef.current = new Map();
    let audio = elementsRef.current.get(spout);
    if (!audio) {
      audio = new Audio(FOUNTAIN_AUDIO_SRC);
      audio.preload = "auto";
      audio.loop = true;
      audio.volume = FOUNTAIN_AUDIO_VOLUME;
      elementsRef.current.set(spout, audio);
    }
    return audio;
  }, []);

  const startSpoutAudio = useCallback(
    (spout: FountainSpout, offsetMs: number) => {
      const audio = getElement(spout);
      audio.currentTime = offsetMs / 1000;
      audio.play().catch((err) => console.error("fountain playback failed", err));
    },
    [getElement]
  );

  const stopSpoutAudio = useCallback((spout: FountainSpout) => {
    elementsRef.current?.get(spout)?.pause();
  }, []);

  const stopAllAudio = useCallback(() => {
    elementsRef.current?.forEach((audio) => audio.pause());
  }, []);

  return { startSpoutAudio, stopSpoutAudio, stopAllAudio };
}
