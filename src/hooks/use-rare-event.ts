"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  EXPLOSION_AUDIO_SRC,
  EXPLOSION_TO_SIRENS_DELAY_MS,
  EXPLOSION_VOLUME,
  POLICE_SIREN_AUDIO_SRC,
  RADIO_CHATTER_AUDIO_SRC,
  RADIO_CHATTER_VOLUME,
  RARE_EVENT_START_DELAY_MS,
  RARE_EVENT_TOTAL_DURATION_MS,
  SIREN_PEAK_FRACTION,
  SIREN_RAMP_INTERVAL_MS,
  SIREN_VOLUME_END,
  SIREN_VOLUME_PEAK,
  SIREN_VOLUME_START,
} from "@/lib/rare-event-constants";
import { shouldFireRareEvent } from "@/lib/rare-event";

type AudioKey = "explosion" | "chatter" | "siren";

/**
 * The rare "explosion" easter egg: on an eligible round start (never the
 * first round of a session, never twice — a browser refresh is the only
 * reset), a small chance (RARE_EVENT_CHANCE, rare-event-constants.ts) fires
 * a scripted RARE_EVENT_TOTAL_DURATION_MS-long sequence: Explosion.mp3 at
 * full volume, then radio chatter and a police siren starting together,
 * the siren rising then falling in volume across the rest of the event.
 *
 * Sets suppressAmbientRef.current — true for rounds this fires, so the
 * fountain and church-bell hooks (called after this one in
 * piazza-backdrop.tsx; call order is load-bearing here, see the comment
 * there) skip their own roll that round, per Stefan's requirement that
 * this event never overlaps either of them.
 *
 * No React state of its own — this is pure imperative side effect (Audio
 * elements + timers), same rationale as use-fountain-audio.ts for living
 * in hooks/, not lib/.
 */
export function useRareEvent(roundStartToken: number, suppressAmbientRef: RefObject<boolean>): void {
  const isInitialMountRef = useRef(true);
  const isFirstRealRoundRef = useRef(true);
  const hasFiredRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rampIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<Partial<Record<AudioKey, HTMLAudioElement>>>({});

  const getAudio = useCallback((key: AudioKey, src: string, volume: number): HTMLAudioElement => {
    let audio = audioRef.current[key];
    if (!audio) {
      audio = new Audio(src);
      audio.preload = "auto";
      audioRef.current[key] = audio;
    }
    audio.volume = volume;
    return audio;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rampIntervalRef.current !== null) {
      clearInterval(rampIntervalRef.current);
      rampIntervalRef.current = null;
    }
  }, []);

  const pauseAllAudio = useCallback(() => {
    Object.values(audioRef.current).forEach((audio) => audio?.pause());
  }, []);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const isFirstRound = isFirstRealRoundRef.current;
    isFirstRealRoundRef.current = false;

    const fires = shouldFireRareEvent({ isFirstRound, alreadyFired: hasFiredRef.current });
    suppressAmbientRef.current = fires;
    if (!fires) return;

    hasFiredRef.current = true;
    clearTimers();
    pauseAllAudio();

    timersRef.current.push(
      setTimeout(() => {
        getAudio("explosion", EXPLOSION_AUDIO_SRC, EXPLOSION_VOLUME)
          .play()
          .catch((err) => console.error("explosion playback failed", err));

        timersRef.current.push(
          setTimeout(() => {
            getAudio("chatter", RADIO_CHATTER_AUDIO_SRC, RADIO_CHATTER_VOLUME)
              .play()
              .catch((err) => console.error("radio chatter playback failed", err));

            const siren = getAudio("siren", POLICE_SIREN_AUDIO_SRC, SIREN_VOLUME_START);
            siren.loop = true;
            siren.play().catch((err) => console.error("police siren playback failed", err));

            // Rises from SIREN_VOLUME_START to SIREN_VOLUME_PEAK across the
            // first SIREN_PEAK_FRACTION of the siren's own active window
            // (from now until the whole event's RARE_EVENT_TOTAL_DURATION_MS
            // mark), then falls back to SIREN_VOLUME_END across the rest.
            // Plain HTMLAudioElement has no ramp API (no Web Audio nodes
            // anywhere in this app), so it's stepped on an interval instead.
            const sirenActiveMs = RARE_EVENT_TOTAL_DURATION_MS - EXPLOSION_TO_SIRENS_DELAY_MS;
            const peakAtMs = sirenActiveMs * SIREN_PEAK_FRACTION;
            const rampStartedAt = Date.now();
            rampIntervalRef.current = setInterval(() => {
              const elapsed = Date.now() - rampStartedAt;
              let volume: number;
              if (elapsed >= sirenActiveMs) {
                volume = SIREN_VOLUME_END;
              } else if (elapsed <= peakAtMs) {
                volume = SIREN_VOLUME_START + (SIREN_VOLUME_PEAK - SIREN_VOLUME_START) * (elapsed / peakAtMs);
              } else {
                volume =
                  SIREN_VOLUME_PEAK +
                  (SIREN_VOLUME_END - SIREN_VOLUME_PEAK) * ((elapsed - peakAtMs) / (sirenActiveMs - peakAtMs));
              }
              siren.volume = Math.min(1, Math.max(0, volume));
            }, SIREN_RAMP_INTERVAL_MS);
          }, EXPLOSION_TO_SIRENS_DELAY_MS)
        );

        timersRef.current.push(
          setTimeout(() => {
            clearTimers();
            pauseAllAudio();
          }, RARE_EVENT_TOTAL_DURATION_MS)
        );
      }, RARE_EVENT_START_DELAY_MS)
    );
    // suppressAmbientRef and the getAudio/clearTimers/pauseAllAudio
    // callbacks are a ref and stable callbacks, not real reactive
    // dependencies — roundStartToken is the only real trigger here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundStartToken]);

  useEffect(() => {
    return () => {
      clearTimers();
      pauseAllAudio();
    };
  }, [clearTimers, pauseAllAudio]);
}
