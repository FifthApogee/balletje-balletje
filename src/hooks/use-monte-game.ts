"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CupId, CupJitter, GameSession } from "@/lib/game-types";
import {
  BONUS_SWAP_CHANCE,
  BONUS_SWAP_DELAY_MS_MAX,
  BONUS_SWAP_DELAY_MS_MIN,
  CUP_IDS,
  CUP_JITTER_RANGE_PX,
  CUP_JITTER_Y_MIN,
  LIFT_TRANSITION_MS,
  REVEAL_DURATION_MS,
  SWAP_COUNT_MAX,
  SWAP_COUNT_MIN,
  SWAP_INTERVAL_MS_MAX,
  SWAP_INTERVAL_MS_MIN,
} from "@/lib/game-constants";
import { applySwap, applySwaps, generateShuffle, randomInt } from "@/lib/shuffle";
import { getTellCupId, TELL_SWITCH_SWAP_INDEX } from "@/lib/tell";
import { useRoundSignal } from "./use-round-signal";
import { useSwooshAudio } from "./use-swoosh-audio";

function randomCupId(): CupId {
  return CUP_IDS[Math.floor(Math.random() * CUP_IDS.length)];
}

function randomJitter(): CupJitter {
  // y is always applied as a backward lift (cup.tsx), and never 0, so a
  // cup's base never sits on (and covers) the floor line.
  return {
    x: randomInt(-CUP_JITTER_RANGE_PX, CUP_JITTER_RANGE_PX),
    y: randomInt(CUP_JITTER_Y_MIN, CUP_JITTER_RANGE_PX),
  };
}

function randomCupJitter(): Record<CupId, CupJitter> {
  return Object.fromEntries(CUP_IDS.map((id) => [id, randomJitter()])) as Record<CupId, CupJitter>;
}

function noJitter(): Record<CupId, CupJitter> {
  return Object.fromEntries(CUP_IDS.map((id) => [id, { x: 0, y: 0 }])) as Record<CupId, CupJitter>;
}

function initialSession(): GameSession {
  return {
    phase: "idle",
    order: [...CUP_IDS],
    // Fixed, not random: this runs during both the server render and the
    // client hydration render, and a random value here would differ between
    // the two and trigger a hydration mismatch. The real ball position and
    // cup jitter are only ever randomized inside startRound(), a client-only
    // event handler.
    ballCupId: CUP_IDS[0],
    tellCupId: CUP_IDS[2],
    pickedCupId: null,
    liftedCups: [],
    cupJitter: noJitter(),
    score: { wins: 0, losses: 0 },
  };
}

interface SequenceStep {
  run: () => void;
  delay: number;
}

export function useMonteGame() {
  const [session, setSession] = useState<GameSession>(initialSession);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards startRound against firing twice for what should be a single click
  // (e.g. a double-click landing before React has re-rendered the button
  // away) — the Start/Play again button is only ever rendered during
  // idle/revealed, so this only needs to cover that brief synchronous gap.
  const startingRef = useRef(false);
  const { planRandomSwoosh, planBonusSwoosh, play, volume, setVolume, muted, toggleMuted } = useSwooshAudio();
  const { triggerRoundStart } = useRoundSignal();

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Guards against a shuffle/reveal timer firing into an unmounted component.
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Runs a list of steps in order: each step's `run()` fires immediately when
  // its turn comes, then waits `delay` ms before the next one starts.
  const runSequence = useCallback((steps: SequenceStep[]) => {
    const runStep = (index: number) => {
      steps[index].run();
      if (index + 1 < steps.length) {
        timerRef.current = setTimeout(() => runStep(index + 1), steps[index].delay);
      }
    };
    runStep(0);
  }, []);

  const startRound = useCallback(() => {
    if (startingRef.current) return;
    startingRef.current = true;
    triggerRoundStart();

    clearTimer();

    const isFirstRound = session.phase === "idle";
    const wasCorrectGuess = !isFirstRound && session.pickedCupId === session.ballCupId;
    const pickedCupId = session.pickedCupId;
    // The ball keeps its cup identity across rounds — only its slot gets
    // reshuffled — except for the very first round, which still starts from
    // a random cup. Cups are otherwise left wherever the last shuffle put
    // them; there's no "home" layout to snap back to.
    const ballCupId = isFirstRound ? randomCupId() : session.ballCupId;
    const ballCupStyle = isFirstRound || wasCorrectGuess ? "full" : "tilt";
    // Each cup gets its own fresh random wobble this round — a visual
    // distraction, independent of the shuffle logic.
    const cupJitter = randomCupJitter();

    // The whole shuffle (and, if it happens, the bonus swap) is generated
    // up front, exactly like the swoosh sound plan — so the tell can be
    // computed from where cups will actually end up, not re-derived live
    // from the still-shuffling order. Never on the very first round — the
    // player needs at least one honest shuffle before the game starts
    // pulling extra tricks.
    const swapSteps = generateShuffle(randomInt(SWAP_COUNT_MIN, SWAP_COUNT_MAX));
    const hasBonusSwap = !isFirstRound && Math.random() < BONUS_SWAP_CHANCE;
    const bonusStep = hasBonusSwap ? generateShuffle(1)[0] : null;

    const orderAfterShuffle = applySwaps(session.order, swapSteps);
    const tellCupIdAfterShuffle = getTellCupId(orderAfterShuffle, ballCupId);
    // If the bonus swap fires, the tell needs to reflect the arrangement
    // after that too — precomputed now, applied later in that step's run(),
    // exactly like the bonus swap's own order/jitter update already are.
    const tellCupIdAfterBonus = bonusStep
      ? getTellCupId(applySwap(orderAfterShuffle, bonusStep), ballCupId)
      : tellCupIdAfterShuffle;

    const steps: SequenceStep[] = [
      {
        // Lift all three cups together before shuffling, to prove there's
        // only one ball: the ball's cup goes up further (or stays tilted, if
        // continuing a wrong guess's reveal) than the other two. After a
        // wrong guess this brings the third, still-closed cup up to join
        // the picked cup and the ball's cup, already lifted from the reveal,
        // rather than closing everything first.
        // Deliberately does NOT set tellCupId yet — cups are still at rest
        // here (the pre-shuffle peek reveal), so switching the glint to a
        // different cup this early would be a bare, static jump anyone could
        // catch. It switches later, mid-shuffle (see TELL_SWITCH_SWAP_INDEX
        // below), while the cups are already in motion to mask it.
        run: () =>
          setSession((prev) => ({
            ...prev,
            phase: "sequencing",
            ballCupId,
            cupJitter,
            liftedCups: CUP_IDS.map((id) => ({
              cupId: id,
              style: id === ballCupId ? ballCupStyle : id === pickedCupId ? "full" : "peek",
            })),
          })),
        delay: REVEAL_DURATION_MS,
      },
      {
        run: () => setSession((prev) => ({ ...prev, liftedCups: [], pickedCupId: null })),
        delay: LIFT_TRANSITION_MS,
      },
      {
        run: () => setSession((prev) => ({ ...prev, phase: "shuffling" })),
        delay: 0,
      },
    ];

    // Swap count and pacing are randomized within bounds each round, so no
    // two shuffles play out identically.
    const swapIntervalMs = randomInt(SWAP_INTERVAL_MS_MIN, SWAP_INTERVAL_MS_MAX);
    // Tracks the previous swap's clip so the same one never plays twice in a
    // row — clips can still repeat elsewhere later in the sequence.
    let previousSwooshSrc: string | undefined;
    swapSteps.forEach((swapStep, swapIndex) => {
      // Which swoosh clip plays and at what rate is decided now, once per
      // swap, alongside the rest of this round's timeline — not re-rolled
      // inside the timer callback on every fire.
      const swooshPlan = planRandomSwoosh(swapIntervalMs, previousSwooshSrc);
      previousSwooshSrc = swooshPlan.clip.src;
      const isTellSwitchSwap = swapIndex === TELL_SWITCH_SWAP_INDEX;
      steps.push({
        // Jitter is re-rolled on every swap, not just once per round — a
        // cup that kept the same wobble the whole shuffle would give
        // everyone watching, not just the operator, a way to track it.
        run: () => {
          setSession((prev) => ({
            ...prev,
            order: applySwap(prev.order, swapStep),
            cupJitter: randomCupJitter(),
            ...(isTellSwitchSwap ? { tellCupId: tellCupIdAfterShuffle } : {}),
          }));
          play(swooshPlan);
        },
        delay: swapIntervalMs,
      });
    });

    // Occasionally, a bonus swap sneaks in partway through guessing — a rare
    // extra twist after the player's already started deciding. If they pick
    // before it fires, pickCup()'s clearTimer() cancels it like any other
    // pending step.
    steps.push({
      run: () => setSession((prev) => ({ ...prev, phase: "guessing" })),
      delay: hasBonusSwap ? randomInt(BONUS_SWAP_DELAY_MS_MIN, BONUS_SWAP_DELAY_MS_MAX) : 0,
    });

    if (bonusStep) {
      const bonusSwooshPlan = planBonusSwoosh();
      steps.push({
        run: () => {
          setSession((prev) => ({
            ...prev,
            order: applySwap(prev.order, bonusStep),
            tellCupId: tellCupIdAfterBonus,
            cupJitter: randomCupJitter(),
          }));
          play(bonusSwooshPlan);
        },
        delay: 0,
      });
    }

    runSequence(steps);
    // Safe to clear right away: steps[0].run() has already fired synchronously
    // above, moving phase off idle/revealed, so the button that calls
    // startRound is already gone by the time any further click could land.
    startingRef.current = false;
  }, [clearTimer, planBonusSwoosh, planRandomSwoosh, play, runSequence, session, triggerRoundStart]);

  const pickCup = useCallback(
    (cupId: CupId) => {
      if (session.phase !== "guessing") return;
      clearTimer();

      const won = cupId === session.ballCupId;
      const ballCupId = session.ballCupId;

      setSession((prev) => ({
        ...prev,
        phase: "revealed",
        pickedCupId: cupId,
        liftedCups: [{ cupId, style: "full" }],
        score: {
          wins: prev.score.wins + (won ? 1 : 0),
          losses: prev.score.losses + (won ? 0 : 1),
        },
      }));

      if (won) return;

      // A wrong guess only showed the picked cup empty — after a beat, also
      // lift the ball's actual cup (tilted), alongside the picked cup rather
      // than in place of it, so both stay up for comparison: what you
      // picked, and where it actually was.
      runSequence([
        { run: () => {}, delay: REVEAL_DURATION_MS },
        {
          run: () =>
            setSession((prev) => ({
              ...prev,
              liftedCups: [...prev.liftedCups, { cupId: ballCupId, style: "tilt" }],
            })),
          delay: 0,
        },
      ]);
    },
    [clearTimer, runSequence, session]
  );

  const resetScore = useCallback(() => {
    // The wrong-guess tilt reveal (pickCup) runs its timer while phase stays
    // "revealed" — cancel it so a stale step can't re-lift a cup after the
    // score's already been zeroed.
    clearTimer();
    setSession((prev) => {
      const next: GameSession = { ...prev, score: { wins: 0, losses: 0 } };
      // A revealed round leaves a cup lifted — bring it back down instead of
      // leaving it open under a zeroed scoreboard.
      if (prev.phase === "revealed") {
        next.phase = "idle";
        next.pickedCupId = null;
        next.liftedCups = [];
      }
      return next;
    });
  }, [clearTimer]);

  return {
    session,
    startRound,
    pickCup,
    resetScore,
    audio: { volume, setVolume, muted, toggleMuted },
  };
}
