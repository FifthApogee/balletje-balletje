"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateFountainPlan } from "@/lib/fountain";
import { CONTINUE_CHANCE, FOUNTAIN_SPOUTS, INITIAL_DELAY_MS_MAX, INITIAL_DELAY_MS_MIN, type FountainSpout } from "@/lib/fountain-constants";
import { randomInt } from "@/lib/shuffle";
import { useFountainAudio } from "./use-fountain-audio";

export type { FountainSpout } from "@/lib/fountain-constants";

// Drives the fountain as a background distractor, tied to round starts (see
// use-round-signal.ts) rather than running on its own independent cycle:
// each round, a fresh plan is rolled (lib/fountain.ts) — how many of the
// three faucets pour, in what order, and for how long — then played out
// against real timers here. Timers and Audio elements are side effects, so
// this lives in hooks/, not lib/.

function dryFlow(): Record<FountainSpout, boolean> {
  return Object.fromEntries(FOUNTAIN_SPOUTS.map((spout) => [spout, false])) as Record<FountainSpout, boolean>;
}

export function useFountainWater(roundStartToken: number): Record<FountainSpout, boolean> {
  const [flowingSpouts, setFlowingSpouts] = useState<Record<FountainSpout, boolean>>(dryFlow);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Wall-clock time the currently scheduled plan finishes; 0 while dry.
  const activeUntilRef = useRef(0);
  // The effect below fires once on mount (React always runs a fresh effect
  // once) even though no round has actually started yet — skip that one so
  // the fountain stays dry until the first real startRound() call.
  const isInitialMountRef = useRef(true);
  const { startSpoutAudio, stopSpoutAudio, stopAllAudio } = useFountainAudio();

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const schedulePlan = useCallback(() => {
    const plan = generateFountainPlan();
    if (plan.events.length === 0) {
      activeUntilRef.current = 0;
      return;
    }

    const initialDelayMs = randomInt(INITIAL_DELAY_MS_MIN, INITIAL_DELAY_MS_MAX);
    const totalDurationMs = Math.max(...plan.events.map((event) => event.stopMs));
    activeUntilRef.current = Date.now() + initialDelayMs + totalDurationMs;

    plan.events.forEach((event) => {
      timersRef.current.push(
        setTimeout(() => {
          setFlowingSpouts((prev) => ({ ...prev, [event.spout]: true }));
          startSpoutAudio(event.spout, event.audioOffsetMs);
        }, initialDelayMs + event.startMs),
        setTimeout(() => {
          setFlowingSpouts((prev) => ({ ...prev, [event.spout]: false }));
          stopSpoutAudio(event.spout);
        }, initialDelayMs + event.stopMs)
      );
    });
  }, [startSpoutAudio, stopSpoutAudio]);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // A previous round's pour still running as this one starts gets a
    // chance to just keep going, untouched, instead of always being cut
    // short and re-rolled.
    const stillActive = Date.now() < activeUntilRef.current;
    if (stillActive && Math.random() < CONTINUE_CHANCE) return;

    clearAllTimers();
    stopAllAudio();
    setFlowingSpouts(dryFlow());
    schedulePlan();
    // roundStartToken is the only real trigger here — the callbacks it's
    // paired with are stable across renders (useCallback) or read via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundStartToken]);

  useEffect(() => {
    return () => {
      clearAllTimers();
      stopAllAudio();
    };
  }, [clearAllTimers, stopAllAudio]);

  return flowingSpouts;
}
