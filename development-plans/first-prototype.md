# First Prototype — Implementation Plan

**Target:** a deployed, playable balletje-balletje with an animated shuffle, running score, and a visual tell only the operator notices.

**Budget:** ~1 day of focused work. Estimates below total ~6–7 hours plus slack.

**Ground rules:** work top to bottom. **Stop at every PAUSE and wait for Stefan's approval before continuing.** Do not run ahead because the next step looks obvious. See `CLAUDE.md` §9.

**Status legend:** ☐ not started · ☑ done

---

## Step 0 — Scaffolding ☑ DONE

Next.js 16 (App Router, TypeScript, Tailwind v4, `src/`), shadcn/ui initialized with `button` + `card`, `turbopack.root` pinned in `next.config.ts`, production build verified green, git repo initialized.

---

## Step 1 — Game core: types, constants, shuffle logic ☑ DONE

*No UI. No React. Pure functions only.* (~45 min)

**Files**
- `src/lib/game-types.ts`
- `src/lib/game-constants.ts`
- `src/lib/shuffle.ts`

**Build**

1. **Types** — `CupId` (three stable ids), `GamePhase` (`'idle' | 'shuffling' | 'guessing' | 'revealed'`), `SwapStep` (a pair of slot indices), and the `GameSession` object exactly as specified in `CLAUDE.md` §5.

2. **Constants** — one home for every tunable number:
   - `CUP_IDS` — the three stable ids
   - `SWAP_COUNT` — how many swaps per shuffle (start at 7)
   - `SWAP_DURATION_MS` — CSS transition length (start at 320)
   - `SWAP_INTERVAL_MS` — delay between swaps (start at 340; must be ≥ duration or cups teleport mid-flight)
   - slot geometry: cup width, gap

3. **`generateShuffle(swapCount)`** — returns `SwapStep[]`, each a random pair of the three slots. Two constraints, both to stop the shuffle looking stupid:
   - never emit the same pair twice in a row (it visibly undoes itself)
   - never emit a degenerate pair (a slot with itself)

4. **`applySwap(order, step)`** — pure; returns a new order array with the two slots exchanged. No mutation.

**Done when:** the module type-checks and the logic reads correctly. No visual verification possible yet.

**Note:** no test runner is installed (deliberate, `CLAUDE.md` §12). These functions are verified by playing the game in Step 3. If `generateShuffle` turns out fiddly, adding Vitest for `lib/` only is the sanctioned escape hatch — ask first.

---

## Step 2 — Static playable game (no animation) ☑ DONE (merged with Step 3, see below)

*The full game loop, working, with instant cup swaps.* (~1.5 h)

**Files**
- `src/hooks/use-monte-game.ts`
- `src/components/game/cup.tsx`
- `src/components/game/cup-row.tsx`
- `src/components/game/scoreboard.tsx`
- `src/components/game/game-board.tsx`
- `src/app/page.tsx` (rewrite — replaces the Next.js starter page)

**Build**

1. **`useMonteGame`** — owns the one session object. Exposes `session` plus `startRound()`, `pickCup(id)`, `resetScore()`. For this step the shuffle applies **instantly** (all swaps at once, no timing) so the game loop can be validated independently of the animation.

2. **Cup structure** — get this right now, because Step 3 depends on it:
   ```
   <cup wrapper>        ← moves horizontally (translateX to its slot)
     <ball />           ← sits at the bottom, behind the face
     <cup face />       ← lifts vertically (translateY) on reveal
   </cup wrapper>
   ```
   The ball is a **child of the cup**, so it travels with the cup through the shuffle — exactly like the real game.

3. **Static layout** — cups laid out in a plain row for now. No absolute positioning yet; that arrives in Step 3.

4. **Scoreboard** — wins/losses, plus a score reset.

5. **Wire it up** — `page.tsx` renders the board. Needs `"use client"` at the interactive boundary.

**Interaction rules**
- Cups are only clickable in the `guessing` phase.
- Picking moves to `revealed`, scores the round, and reveals the ball.
- A "play again" control returns to `idle`/`shuffling` for the next round, keeping the score.

**Done when:** a full round is playable end to end in the browser — start, cups swap instantly, pick, reveal, score increments, play again works.

> ### ⏸ PAUSE A — play it
> Run `npm run dev` and play several rounds. Questions to settle:
> - Does the round flow feel right, or is a step missing/annoying?
> - Are the cups the right size and spacing on screen?
> - Should "play again" be a button, or should clicking anywhere restart?
>
> **Nothing about animation is judged here** — instant swaps are expected and will look wrong. This pause is about game flow only.

---

## Step 3 — The shuffle animation ☑ DONE

**Note:** implemented together with Step 2 in one pass — the cup structure (position-driven via `transform`, keyed by stable `id`) is identical either way, so building a throwaway instant-swap version first would have been wasted work. The reveal is intentionally minimal (only the picked cup lifts; the "reveal both cups" polish is still Step 4). PAUSE A and PAUSE B are combined into a single test pass below.

*The centrepiece. Where the project succeeds or falls flat.* (~1.5 h)

**Files:** `cup-row.tsx`, `cup.tsx`, `use-monte-game.ts`

**Build**

1. **Position-driven layout** — container becomes `relative`; each cup becomes `absolute` with `transform: translateX(slotIndex × slotWidth)` and a CSS transition on `transform`. Cups keyed by stable `id` (`CLAUDE.md` §4). Reordering the array is now the *only* thing that moves a cup.

2. **Timed playback** — replace the instant shuffle with sequential playback: one `SwapStep` applied every `SWAP_INTERVAL_MS`, phase held at `shuffling` throughout, transitioning to `guessing` on the last step.

3. **Timer cleanup** — clear on unmount and on round reset. Per `CLAUDE.md` §4 this is the most likely bug in the codebase; a stray timer firing into a fresh round will scramble it.

4. **Arc on swap** *(optional polish, cheap)* — give one cup of each swapping pair a slight vertical offset so the two visibly pass around each other instead of sliding through. Sells the motion considerably.

**Done when:** cups visibly slide between positions, the sequence reads as a real shuffle, and the ball stays glued to its cup.

> ### ⏸ PAUSE B — watch it
> This is the tuning pause. Play a dozen rounds and judge:
> - **Speed** — too fast to follow, or too slow to be tense?
> - **Swap count** — is 7 right? More = harder, but drags.
> - **Difficulty** — can you honestly follow the ball? It should be *hard but not hopeless*.
> - Does the arc help, or is it fussy?
>
> Expect to iterate on `SWAP_COUNT` / `SWAP_DURATION_MS` / `SWAP_INTERVAL_MS` here. That is what the constants module is for.

---

## Step 4 — Reveal and round flow polish ☑ DONE (built out further than originally scoped)

*Make winning and losing feel like something.* (~1 h estimated; actual scope grew — see below)

**Files:** `game-types.ts`, `game-constants.ts`, `use-monte-game.ts`, `cup.tsx`, `cup-row.tsx`, `game-board.tsx`

**What actually got built** — Stefan asked for more than the original Step 4 bullets covered, so this step absorbed new scope beyond the original plan text below:

1. **Starting-position reveal** *(new, not in the original plan)* — every round now opens by lifting the ball's cup for `REVEAL_DURATION_MS` (1s) at its starting slot before the shuffle begins, so the player sees where the ball starts.
2. **Reveal both, on a delay** — a wrong guess no longer just sits there silently; clicking "Play again" now plays a short choreographed sequence: close the wrong cup → lift the actual winning cup for 1s → close it → then the new round's starting-position reveal → shuffle. A correct guess skips straight to the starting-position reveal.
3. **Win/lose feedback** — a text message states the result (`text-green-600` / `text-red-600`). *Not done:* a colour cue on the cup itself (original bullet 3's other half) — skipped as redundant with the text message; revisit only if it's actually missed in play.
4. **Phase-correct controls** — done, plus a new phase beyond what was planned.

**Architecture change this required:** `GamePhase` gained a `'sequencing'` value covering every scripted, non-interactive lift/close beat (closing the previous cup, revealing the actual ball, showing the new starting position) — all before `'shuffling'` starts. `GameSession` gained `liftedCupId: CupId | null`, now the single source of truth for which cup is currently lifted. `Cup` no longer derives its own lift state from `phase`/`isPicked`; it just renders whatever `lifted` boolean it's given. The hook drives the whole thing through a small internal step-sequencer (`runSequence`) — a list of `{ run, delay }` steps played out with the same `timerRef`/cleanup pattern the shuffle already used, so there's still exactly one timer in flight at a time.

### Bugs found on first live playtest, fixed

1. **Win/lose text named the wrong-looking cup.** The message read the cup's stable `id` (`a`/`b`/`c`), not its current *slot*. After a shuffle, cup `c` can easily be sitting in the visual "B" position — so a genuinely correct guess could print "the ball was under cup C" while the ball visibly appeared under the cup the player clicked. The data was right; the label was talking about identity, not the position the player was looking at. **Fix:** dropped the cup-letter reference entirely — the message just says "Correct!"/"Wrong!" now, and the visual reveal (lifted cup, and on a wrong guess, the follow-up reveal of the real one) carries the actual answer.
2. **Ball appeared to slide across the table when starting a new round.** `startRound()` reset `order` back to canonical `[a, b, c]` slots at the same moment it lifted the new ball's cup for its starting-position reveal. Since cup position is CSS-transitioned, that reset didn't snap — it visibly animated back to home slots, reading as an extra, unintended shuffle move. **Fix:** stopped resetting `order` between rounds. Cups now simply stay wherever the last shuffle left them; the next round continues from there, same as an analog three-card-monte table has no "home" layout to return to.

### Reset-score behavior (new, requested after playtest)

- The "Reset score" button (`Scoreboard`, already `size="sm"`) is now **disabled while cups are in motion** (`phase === 'sequencing' || phase === 'shuffling'`) — no resetting mid-animation.
- When enabled and clicked during `'revealed'` (a cup currently lifted showing a result), reset now **also lowers that cup** and returns `phase` to `'idle'`, instead of leaving an open cup sitting over a zeroed scoreboard. During `'idle'`/`'guessing'` it just zeroes the score, since no cup is lifted to close.

**Done when:** the reveal reads clearly, a wrong guess visibly shows where the ball actually was, the new round visibly starts from a shown position with no unintended slide, and Reset Score behaves per the above. ✅ Verified via lint + build + SSR-stability smoke test; **not yet re-confirmed live by Stefan** after this fix round — do that before calling this step fully closed.

**Addendum — reveal now distinguishes "empty" from "here's where it was":** the wrong-guess follow-up reveal (the ball's actual cup) now uses a half-lift + tilt (`LiftStyle: "tilt"`, `game-types.ts`) instead of the same full upright lift used for a plain empty-cup show. Tunables in `game-constants.ts` (`TILT_LIFT_PERCENT`, `TILT_ROTATION_DEG`). Lint + build green; not yet watched live.

**Addendum 2 — the tilt reveal now fires immediately after the wrong guess, not at next-round setup:** moved out of `startRound()` and into `pickCup()` itself. On a wrong guess: the picked cup lifts empty (unchanged) → after `REVEAL_DURATION_MS` it closes → the actual ball cup lifts tilted, and **stays tilted-up** until "Play again" is clicked (rather than auto-closing and waiting for the next round to show it). `startRound()`'s opening step ("close whatever cup was left open from the previous round") now handles closing that lingering tilted cup generically — no more special-cased wrong-guess branch there. Also fixed in this pass: `resetScore()` now calls `clearTimer()` first, since this reveal's timer runs while `phase` stays `"revealed"` (not `"sequencing"`) — without the cancel, clicking "Reset score" mid-reveal would leave a stale timer that re-lifts a cup after the score was already zeroed. Lint + build green; not yet watched live.

**Addendum 3 — multi-cup lift, "only one ball" choreography, ball continuity:** superseded above — `liftedCupId`/`liftStyle` (single cup) replaced by `liftedCups: CupLift[]` (`game-types.ts`), so more than one cup can be lifted at once, each with its own style. Changes this enabled, all requested together:
- **Wrong guess keeps both cups up.** The picked (empty) cup no longer closes before the ball's actual cup is revealed — both stay lifted side by side (picked cup full, ball's cup tilted) until "Play again," so the player can compare what they picked against where it actually was.
- **Full lift height halved** (`FULL_LIFT_PERCENT`, was -140%, now -70% — same magnitude as `TILT_LIFT_PERCENT`, differing only by rotation).
- **New `"peek"` lift style** (`PEEK_LIFT_PERCENT`, half of `FULL_LIFT_PERCENT`) — a shallow, non-tilted lift for cups shown empty alongside a real reveal.
- **All three cups lift together at the start of every round** to prove there's only one ball: the ball's cup goes to `"full"` height (or stays `"tilt"` if continuing straight from a wrong guess's reveal), the other two go to `"peek"`. This replaces the old single-cup "starting position" reveal.
- **The ball keeps its cup identity across rounds** (`ballCupId` no longer re-randomized each round) — only the very first round picks a random cup; every round after that continues with whichever cup the ball was already in, same as a real three-card-monte table has no "reset" between hands.

**Addendum 4 — board dressing and unpredictability (small, independent additions, not yet live-tested):**
- **Scorecard moved to a pill in the top-right corner** (`Scoreboard`, restyled as a rounded pill with `border`/`shadow-sm`/`backdrop-blur`), out of the main vertical flow, so it reads as a HUD element rather than part of the round sequence. `GameBoard`'s root gained `relative` positioning to anchor it.
- **Floor line under the cups** — a single `border-b-2` line spanning the cup row plus `FLOOR_OVERHANG` (29px, ~20% past the row) on each side, added in `CupRow`.
- **Independent per-cup jitter** — each cup gets its own small random `{x, y}` pixel offset (`CUP_JITTER_RANGE_PX`, ±6px), re-rolled once per round (`GameSession.cupJitter`), composed into the same slot-position `transform` so it's purely visual and never affects click targets or slot logic. Pure distraction — makes the row look organically uneven instead of a perfect grid.
- **Randomized shuffle pacing** — `SWAP_COUNT` and `SWAP_INTERVAL_MS` (fixed values) replaced by `SWAP_COUNT_MIN`/`MAX` (6–9) and `SWAP_INTERVAL_MS_MIN`/`MAX` (320–400ms), each re-rolled once per round via a new `randomInt()` helper in `shuffle.ts`, so no two shuffles play out identically.

All four verified via lint + build; none watched live yet.

**Addendum 5 — corrections after first live feedback on Addendum 4 (still not watched live post-fix):**
- **Scorecard pinned to the true screen corner, not the board's corner.** `position: absolute` (anchored to `GameBoard`'s own box, top-right, close to the cups) replaced with `position: fixed` at `top-6 left-6` — pinned to the actual viewport, top-left, independent of wherever the board sits on the page. `GameBoard`'s now-unneeded `relative` wrapper was removed.
- **Cup jitter can no longer send a cup off the table's front edge.** `jitter.y` used to be drawn from a symmetric `±CUP_JITTER_RANGE_PX` range and applied directly; a positive value moved a cup down past the floor line, toward the viewer. Fixed by drawing `y` as a non-negative magnitude (`randomInt(0, CUP_JITTER_RANGE_PX)`) and negating it where it's applied (`cup.tsx`) — a cup can only ever drift further back on the table, never forward off it. `x` is unchanged (still symmetric; left/right has no such edge to fall off).
- **Jitter re-rolls on every swap during the shuffle, not just once per round.** Previously each cup's `{x, y}` wobble was rolled once at round start and held fixed through the whole round — which, since jitter travels with cup *identity* exactly like the ball does, meant a sharp-eyed spectator (not just the operator) could track a specific cup through the shuffle by its stable wobble alone, undermining the shuffle itself. Fixed by re-rolling all three cups' jitter (`randomCupJitter()`, factored out as a shared helper) on every swap step, so the wobble itself changes continuously during the shuffle and settles to one last random value only once shuffling stops.
- **Swap pacing slowed to "moderate."** `SWAP_INTERVAL_MS_MIN`/`MAX` changed from 320–400ms to 250–380ms. Since the interval must stay above the cup-slide transition duration (`SWAP_DURATION_MS`) or cups visibly teleport mid-swap, `SWAP_DURATION_MS` was lowered from 320ms to 230ms to keep a safe margin under the new 250ms floor — an unavoidable side effect of allowing faster swaps, not an independent tuning choice.
- **Table widened another 20%.** `FLOOR_OVERHANG`: 29px → 35px (24 → 29 → 35 across the two widenings). **Total table width is now 494px** (`ROW_WIDTH` 424px + `FLOOR_OVERHANG` 35px × 2 sides).

Verified via lint + build; not yet watched live.

**Addendum 6 — jitter floor guarantee, wider swap-count range, and a rare bonus swap (still not watched live):**
- **Cups can no longer cover the floor line.** `jitter.y` was drawn from `[0, CUP_JITTER_RANGE_PX]`, which could still land on exactly 0 — sitting the cup's base right back on the line, covering it. Fixed with a new `CUP_JITTER_Y_MIN` floor: `y` is now drawn from `[CUP_JITTER_Y_MIN, CUP_JITTER_RANGE_PX]`, so a cup is always lifted at least slightly clear of the line, never exactly on it. (Values hand-tuned since: `CUP_JITTER_RANGE_PX` is now 9, `CUP_JITTER_Y_MIN` is now 2 — range 2–9px.)
- **Swap count range widened.** `SWAP_COUNT_MAX`: 9 → 10 (range is now 6–10).
- **New: a rare bonus swap during guessing.** Once per round, a 10% roll (`BONUS_SWAP_CHANCE`) decides whether, partway through the `"guessing"` phase — after `BONUS_SWAP_DELAY_MS_MIN`–`MAX` (1.2–2s) — one more single swap fires on its own, silently reordering two cups while the player is already looking and deciding. Implemented as one extra step appended to `startRound()`'s existing step sequence (a single swap via `generateShuffle(1)`, plus a fresh `cupJitter` roll for consistency with the shuffle's own re-rolling). `phase` stays `"guessing"` throughout, so cups remain clickable the whole time; if the player picks before the bonus swap fires, `pickCup()`'s existing `clearTimer()` cancels it, same as any other pending step. No new architecture — reuses the single-timer sequencer already in place.

Verified via lint + build; not yet watched live.

**Design question raised, not yet implemented — swoosh sound effects:** Stefan has downloaded several swoosh sound effect files and asked two design questions (answers only, no code written yet):

1. *Randomize the sound per swap, or assign a fixed one per cup?* **Per swap, not per cup.** A fixed per-cup sound would recreate exactly the bug just fixed for jitter (Addendum 6, above): a cup's identity would carry a stable, recognizable signature (this time audible, not visual) all the way through the shuffle, letting anyone listening — not just the operator — track a specific cup by ear. Randomizing which clip plays on every individual swap event, independent of which two cups are involved, avoids that entirely and also just sounds more natural (a real shuffle doesn't make the identical sound every time the same cup moves).

2. *Do the clips need to be cut to an exact length, or can they be sped up/slowed down to fit?* **Rough-trim, don't hard-cut, and stretch at runtime.** Swap duration/interval are already randomized per round (`SWAP_DURATION_MS` / `SWAP_INTERVAL_MS_MIN`–`MAX`) and have already been retuned twice this session — a clip pre-cut to one exact frame length would go stale the next time those constants change. Better: trim each source file so it starts right at the swoosh onset (remove dead air, no need for frame-perfect length), then set the `<audio>`/`AudioBufferSourceNode`'s `playbackRate` at runtime to stretch or compress it to fit whatever the current swap's actual duration is. The trade-off: `playbackRate` isn't pitch-corrected, so a slowed-down clip drops in pitch and a sped-up one rises — for a short swoosh at the kind of small ratios needed here (roughly ±20–30%), that's normally not objectionable, and a slightly higher-pitched "quick" swoosh even suits a snappy sub-300ms swap. Worth a quick listen-test once actually wired up, since "acceptable pitch shift" is a judgment call, not something to guess from code.

Scope note: `CLAUDE.md` §2 and §11 currently list sound effects as explicitly out of scope for this prototype ("Explicitly out of scope (for now): ... Sound", "Deliberately not doing: ... Sound effects"). These answers are prep only; bringing sound into the prototype is a scope decision for Stefan to make explicitly, not something to start wiring in as a side effect of answering these questions.

> ### ⏸ PAUSE C — review the feel
> - Is the reveal timing right, or does it rush the moment?
> - Is the wrong-guess reveal satisfying or annoying?
> - Does the new starting-position beat on every round start feel like a nice touch or a delay you want to skip?
> - Does "Correct!"/"Wrong!" without a cup letter feel sufficient, or is more feedback wanted?
> - Anything in the round loop that feels clumsy on repeat plays?
> - Worth adding the on-cup colour cue from bullet 3, or is the text enough?

---

## Step 5 — The visual tell ☑ IMPLEMENTED (third attempt — not yet live-tested)

*The operator's edge. Small change, high stakes.* (~45 min)

**Files:** `cup.tsx`, `game-constants.ts`

**Build**

1. Give the ball-carrying cup a **barely-perceptible** difference. Candidates, cheapest first:
   - a hairline shade shift on the cup base
   - a fractionally different rim thickness or corner radius
   - a slightly different shadow depth
   - a tiny asymmetry in a decorative detail

2. Keep it in **one place**, driven by the cup's `isWinner` prop and a single tunable constant, so intensity can be dialled up or down without hunting (`CLAUDE.md` §4).

**The calibration problem:** the tell must be invisible to someone who does not know it exists, yet unmistakable to someone who does — across viewing angles and screens. This is genuinely hard to judge from the code, and it is the one step that **must** be validated with real eyes.

**Attempt 1 — on-cup shade shift, rejected as too obvious:** the ball's cup got a fractionally darker gradient stop (`to-amber-800` vs. base `to-amber-700`). Reverted at Stefan's call before any live test — judged too obvious on sight, without needing to compare cups side by side.

**Attempt 2 — on-page heading Cyrillic swap, rejected as the opposite failure:** moved the tell off the cups entirely into the page heading (`Balletje-balletje`), swapping the Latin "a" in each half for the look-alike Cyrillic "а" (U+0430) to encode the ball's current slot. Reverted at Stefan's call: **indistinguishable even to the person who knows it's there** — glyph swaps have no middle ground to dial (either genuinely different-looking, or truly invisible), unlike a CSS property. `src/lib/tell.ts` has been deleted; cup faces are visually identical again and the heading is back to the plain static string.

**Current state: no tell exists in the code.** Both candidates above are ruled out, not just untried. The lesson driving the option list below: whatever's chosen next needs a **continuous, single-number intensity knob** (opacity, blur, degrees, alpha) so it can actually be calibrated at Pause D — not a binary swap with no middle setting.

**Candidate options for the next attempt (brainstormed, not yet built or chosen):**

| # | Tell | Difficulty (1–10) | Noticing risk (1–10, 10 = too obvious) | Notes |
|---|------|:-:|:-:|---|
| 1 | Fixed micro-mark (faint rivet/dot at one known spot on the rim) | 2 | 4 — tunable via opacity | **Current top pick.** Turns "notice a subtle difference" into "check one known coordinate" — faster and more robust across screens than a comparative judgment. |
| 2 | Shadow depth nudge (box-shadow alpha/blur, continuously tunable) | 2 | 5 | Cheap, but a relative "which one looks darker" judgment — lighting/monitor-dependent. |
| 3 | Rim clip-path nudge (~1% narrower/wider) | 3 | 5 | Lives on the cup shape itself; risks reading as a rendering glitch if pushed too far. |
| 4 | Baseline micro-rotation at rest (0.5–1°) | 2 | 6 | Easy to catch once two cups sit side by side motionless for comparison. |
| 5 | Micro scale difference | 2 | 7 | Riskiest geometric option — size differences are the most perceptually salient of the bunch. |
| 6 | Off-cup indicator (heading/tab text) | 3 | 2 or 10, no middle | Already tried twice in different forms (shade, Cyrillic) — ruled out categorically: no continuous dial, and decoupled from the object being watched. |
| 7 | Sound cue | 3 | 3 | Out of scope — `CLAUDE.md` explicitly excludes sound. |
| 8 | Slightly longer swap animation for the ball's cup during shuffle | 6 | 6 | Hard to read reliably mid-motion; weak "at a glance" fit even tuned well. |
| 9 | Faint secondary "shadow ball" shape under the winner's rim at rest | 5 | 4 | More build effort than #1 (own positioned element, z-index care) for similar payoff. |
| 10 | Rivet/dot count difference (e.g. winner has 2, others have 1) | 4 | 5 | A countable structural cue rather than a shade — adds a permanent extra element to every cup. |

**Recommendation carried forward: option 1** (fixed micro-mark), for the reasons above.

**Attempt 3 — built, per Stefan's explicit direction (2026-07-28):** two decisions changed the shape of this step from the original plan text above:

1. **The tell is no longer on the ball's own cup.** It's on the cup two steps around the fixed `a → b → c → a` cycle from wherever the ball is (`getTellCupId` in the new `src/lib/tell.ts`): ball in `a` → tell on `c`; ball in `b` → tell on `a`; ball in `c` → tell on `b`. Finding the tell no longer hands you the ball outright — the operator has to know the offset rule too. This supersedes bullet 2's original "driven by the cup's `isWinner` prop" wording; it's now driven by `hasTell` (`cupId === getTellCupId(ballCupId)`), computed once per round in `CupRow` from `ballCupId` alone — no new session state, since it's a pure derivation exactly like `hasBall` already is.
2. **The tell itself is the rim glint** (candidate refinement of option 1 from the table above): a small, blurred, low-opacity white dot at one fixed rim coordinate on the tell cup's face, rendered as a child of the cup-face div in `cup.tsx` so it inherits the same lift/tilt transform and clip-path as the cup itself. All tunables — the derivation function and every glint constant (`TELL_GLINT_OPACITY`, `_SIZE_PX`, `_BLUR_PX`, `_TOP_PX`, `_LEFT_PERCENT`) — live together in `src/lib/tell.ts`, per `CLAUDE.md` §4's "one clearly-marked place."

**Done when:** the operator can name the tell cup at a glance, every time, from normal viewing distance, and can reliably derive the ball's cup from it (two steps back around the cycle). **Not yet watched live** — this is exactly what Pause D below is for.

**Attempt 3, corrected (2026-07-28) — tell moved from identity-based to position-based:** the identity-cycle version above had a real usability flaw, caught before live testing: `getTellCupId(ballCupId)` picked the tell cup via an offset over the *stable identity* array (`CUP_IDS`), but cup identity is never shown anywhere on screen and only coincides with on-screen slot position at the very start of the game, before the first shuffle. After that, an operator has no way to look at the tell-glinting cup and know "this is cup `c`" — so the "+2 identity steps" rule wasn't actually appliable by eye.

**Fix — precompute the shuffle's outcome, same pattern as the swoosh audio plan:** the whole point of `generateShuffle()` is that every swap is already known before any of it plays; that same upfront knowledge is now used to fold the swaps forward (`applySwaps`, `lib/shuffle.ts`) and find the exact slot arrangement the cups will be resting in once the shuffle (and, if it fires, the bonus swap) settles. `getTellCupId` (`lib/tell.ts`) now takes that resting arrangement plus `ballCupId` and returns the cup 2 *slots* to the right of the ball, wrapping — directly readable off the final, motionless layout, no identity-tracking required. `GameSession` gained a `tellCupId` field (`game-types.ts`), set once per round in `startRound()` alongside `ballCupId` — `CupRow` just reads it, rather than re-deriving it every render.

**The bonus-swap wrinkle:** the rare bonus swap only fires if the player hasn't already picked when its randomized delay elapses, so "the final arrangement" isn't fully knowable with 100% certainty at round start — it depends on live timing. Handled by precomputing *both* possible outcomes up front (with and without the bonus swap) and updating `tellCupId` a second time inside the bonus swap's own step, exactly mirroring how that step already updates `order`/`cupJitter` — so the tell stays accurate to the true final position even in that ~10% case, rather than going stale for the one moment (the bonus swap) the game is deliberately trying to catch the player off guard.

Lint + build green. Not yet watched live.

**Attempt 3, corrected again (2026-07-28) — tell no longer switches while cups are at rest:** live feedback caught a real tell: the previous version set the new round's `tellCupId` in the very first "sequencing" step, immediately on clicking "Play again" — while all three cups are still sitting still for the pre-shuffle peek reveal. That's a bare, static jump (glint disappears from one motionless cup and appears on another) with zero motion to mask it — trivially noticeable. Fixed by moving the switch to fire mid-shuffle instead: `TELL_SWITCH_SWAP_INDEX` (`lib/tell.ts`, currently `2` — the 3rd swap) marks which swap step's `run()` also updates `tellCupId`, alongside that swap's own `order`/`cupJitter` update, so the switch happens while cups are already sliding and the eye is already busy tracking motion. `SWAP_COUNT_MIN` (6) guarantees this index always exists. The bonus-swap tell update was already timed correctly (it only ever applies inside the bonus swap's own step, which is itself a swap) and didn't need this fix.

> ### ⏸ PAUSE D — live playtest (the important one)
> Two separate checks, in order:
> 1. **Can you see it?** From a normal seat, mid-shuffle, without pausing — can you track the ball reliably?
> 2. **Can they see it?** Show it to someone who has not been told. Do they notice anything odd about one cup?
>
> Expect to tune the intensity at least once. Too subtle is a failed trick; too obvious is a busted one. **Do not proceed to deploy until this passes on a real screen with a real person.**

**Addendum 7 — UI/UX polish pass (2026-07-28), pulled forward from Step 6, not yet watched live:**
- **Start / Play again buttons doubled in size** (`game-board.tsx`: `h-16 px-8 text-xl`, up from the default `h-8`/`text-sm`). The disabled status button (`Shuffling…` / `Pick a cup` / `Get ready…`) was matched to the same size so nothing jumps as phase changes.
- **Redundant status text removed.** "Watch closely…" (shuffling) and the duplicate "Pick a cup." (guessing) paragraphs were dropped — the button below already carries that label. "Get ready…" (sequencing) was removed for the same reason. Only "Press start to shuffle." (idle) remains as a paragraph, since idle has no equivalent button label.
- **"Correct!"/"Wrong!" is now a pill**, not plain text: `rounded-full border px-6 py-2 text-2xl font-semibold`, background/border tinted to match its green/red text (`border-green-600/30 bg-green-600/10 text-green-600`, and the red equivalent).
- **Title moved further from the cups.** `h1` gained `mb-16` on top of the existing flex `gap-8`. Math: a fully lifted cup can reach ~73px above the cup row's own top edge (70% lift height + up to 9px jitter); the title now sits ~96px above that row, a comfortable margin so no lift can ever reach into it.
- **Re-entrancy guard on `startRound`** (`startingRef` in `use-monte-game.ts`) — a rapid double-click can't invoke it twice. Not a fix for a confirmed repro (the button already unmounts the instant `phase` leaves idle/revealed, which happens synchronously on click) — added as defense-in-depth since Stefan asked for the same guarantee Reset Score already has.
- **Page background changed off pure white** — `--background` in `globals.css` changed from `oklch(1 0 0)` to a slightly warm off-white, `oklch(0.975 0.005 85)` (light mode only; dark mode was never pure white).
- **Tab title** set to "Balletje-balletje" (`layout.tsx` metadata), replacing the leftover "Create Next App".

---

## Step 6 — Final pass ☐

*Make it presentable.* (~45 min)

**Files:** `layout.tsx`, `globals.css`, `page.tsx`, game components

**Build**

1. **Page chrome** — ☑ done (Addendum 7, above): tab title, off-white background, button sizing, redundant text removed, result pill.
2. **Responsive** — ☐ not yet done. Cup geometry is fixed-pixel from Step 3; make it hold up on a phone and a laptop. Scaling the board container is acceptable and simpler than reworking the slot maths.
3. **Dark/light** — ☐ not yet confirmed. shadcn ships both; the off-white background change (Addendum 7) only touched light mode — need to actually check dark mode still reads well, on a real device/OS dark-mode toggle, not just in code.
4. **Green checks** — ☑ `npm run lint` and `npm run build` both clean as of every change through Addendum 7.

**Piazza background — planned, not yet started (see below for the full design discussion).**

**Done when:** it looks deliberate rather than scaffolded, and lint + build pass.

> ### ⏸ PAUSE E — final look before it goes public
> Review on both a phone and a laptop. Last chance for cosmetic changes before deploy.

---

## Step 6.5 — Piazza background ☐ PLANNED, NOT STARTED

*A background scene behind the game board — atmosphere, and room to hide more tells/distractors later. Not part of the original plan; raised by Stefan on 2026-07-28.*

> **⚠ The design discussion immediately below is SUPERSEDED.** Stefan generated the image and added it to the repo (`public/Piazza-inspo-image.png`), and decided it should be used **as the backdrop itself**, not merely as a reference to hand-translate into components. The agreed, current plan is **"Step 6.5, agreed plan"** further down. The section below is kept only as the record of how we got here (prompt iteration, style reasoning).

### Superseded design discussion (kept for the record)

**Goal:** an Italian-piazza scene (clocktower, mixed old buildings, clouds, a couple of parked scooters/a bicycle, no people) behind the cups, with an open, uncluttered center-foreground reserved for the actual game board.

**Decision: build it as code components, not a single AI-generated image asset.** Stefan wants to be able to actively alter pieces afterward (reposition a cloud, recolor a building, animate later) — a flat illustration or photo would be a single static file with none of that editability. The plan is to use an AI-generated image purely as a **visual reference/spec**, then hand-translate it into small React components (`ClockTower`, `Building`, `Cloud`, `Scooter`, …) built from grid-aligned SVG `<rect>`s at a fixed pixel-unit — i.e. genuine pixel art as data, not a raster sprite. These are purely decorative/non-interactive, so they belong in their own new `src/components/background/` (kept separate from `src/components/game/`, consistent with `CLAUDE.md` §4's "no game logic in components" and the project's existing modularity boundaries — this is scenery, not game state or interaction).

**Art style: 16-bit-era pixel art** (SNES-outdoor-scene style, e.g. Stardew Valley's town squares) — chosen over a flat-vector travel-poster look (the earlier direction, before "build with components" came up) because pixel art maps naturally onto a small number of discrete colored cells, which is exactly the unit `<rect>`-based components need. Color is not a casualty of pixel art — the style is a **deliberately limited, curated palette** (roughly 16–24 hex swatches), not grayscale; once the reference image exists, its actual colors get sampled into a fixed palette (the same way the cups already have their own amber gradient and the page its own off-white) so every component reuses the same handful of tones.

**Prompt iteration, for the record (all for a Gemini image-gen call Stefan runs himself — no image tooling used on this side):**
1. Stefan's first draft: a plain-language "simple art image" request — too vague on style/composition for reproducible results.
2. First revision (Claude): tightened to name a style ("retro Italian travel poster, flat vector"), reserve empty center-foreground for the table, ban text/signage (image models mangle text), pin down lighting/palette, specify 16:9 composition.
3. Pivoted once "build with code components" became the actual goal: style changed from flat-vector-poster to pixel art (better fit for `<rect>`-based reproduction); added an explicit exclusion for the cups/table themselves (the game already renders those — the background must not duplicate them); considered and rejected a "3×3 grid lines" request from Stefan for helping Claude read the image — a 3×3 grid is a rule-of-thirds *composition* guide, far too coarse to extract per-pixel color/shape data. The actually useful ask is a genuinely low **native pixel resolution with hard, blocky edges** (no anti-aliasing) — that makes the art *itself* the grid, at the exact fidelity needed to read colors/positions directly off the file.

**Final prompt (ready to run, not yet run):**
> A 16-bit pixel art scene of an empty piazza (town square) in Rome, in the style of a warm, colorful retro video game background (SNES-era outdoor pixel art, similar to Stardew Valley's town scenes). Render at a genuinely low native pixel resolution — a 64×36 pixel grid (16:9) — with hard, blocky pixel edges: no anti-aliasing, no smoothing, no soft gradients. Each pixel should be a single flat, solid color.
>
> Use a limited, vibrant color palette: warm ochre and terracotta building facades, cream and dusty-pink stone accents, a soft pale-blue sky with a few simple pixel-cloud puffs, and deep brown/maroon tones for shadow and depth.
>
> A tall clocktower with a simple round clock face stands slightly off-center in the background. Old buildings of varying heights, in clean blocky pixel shapes, line the left and right edges of the square — no readable text, no signage, no fine ornamentation, just solid pixel-block forms and simple windows. One or two parked pixel-art scooters and a bicycle sit off to one side, not centered. No people, no cars, no crowds.
>
> Do not include a table, cups, playing cards, or any three-card-monte game elements — our own game board is rendered separately in code and will sit on top of this background. The cobblestone ground in the center-foreground must be completely open, flat, and empty, reserved for that separately-rendered game.
>
> Wide landscape composition (16:9), crisp pixel-grid edges only throughout the entire image.

**Outcome:** Stefan ran the prompt in Gemini and added the result to the repo as `public/Piazza-inspo-image.png`. See the agreed plan below for what happens to it.

---

## Step 6.5, agreed plan — Piazza backdrop, image-first (2026-07-28)

**The pivot:** the superseded section above decided *"build it as code components, not a single AI-generated image asset."* Stefan's direction supersedes that: **the PNG is the backdrop.** "Make parts dynamic later" becomes **progressive replacement** — slice individual pieces out of the image and swap in components one at a time — rather than rebuilding the whole scene from `<rect>`s up front. Gets something on screen in well under an hour, and loses nothing: the component work is still available later, just incremental.

### The asset, as measured (not assumed)

- `public/Piazza-inspo-image.png` — **1376×768** (16:9), 1.4 MB, **23,554 distinct colours**.
- That colour count means it is **not clean flat pixel art** — the generator anti-aliased and dithered it, so "pixels" are noisy blocks rather than a readable grid. Fine as a raster backdrop; it does mean the superseded plan's "sample its palette into hex constants" needs a quantization pass first (see step 1 below).
- **Cobblestone far edge** (the horizon cups would stand behind): y≈554 at centre = **72.1%** of image height, sweeping down to y≈629 = **81.9%** at the left/right edges.
- **Open ground band** is therefore only the **bottom ~28%** of the image (~214px native).
- **Vanishing point x≈690 = 50.1%** — dead centre horizontally, which the cup row already is.

### Decisions taken (Stefan, 2026-07-28)

| Decision | Choice |
|---|---|
| Cup/ground alignment | **Option A — full-viewport `cover` backdrop, one vertical-focus constant.** Game layout untouched. |
| Quantize the PNG | **Yes** — ~32 colours. |
| Floor line under the cups | **Keep it.** (Considered removing as redundant once cobblestone is the floor; Stefan kept it.) |
| Dark mode | **Keep it.** Flagged: a fixed *daylight* backdrop under a dark-mode toggle puts light text over a bright sky. Judge it at Pause E rather than deciding now. |

**Why A over B/C:** B (restructure `GameBoard` into three anchored bands) and C (a fixed 16:9 scene box scaling backdrop + board as one unit) both plant the cups exactly on the cobblestone at any window size, but the honest comparison is that C *also* solves Step 6's still-open "responsive" item — so building B now would be work thrown away, and building C now is work done twice if the art turns out to need changes. A gets the art on screen to be judged in context; **C is the natural upgrade during Step 6's responsive pass.**

**The problem A is knowingly accepting:** the open ground band is 28% of the image, but the game column (title + cups + result pill + button) is ~500px tall. On a 1440×800 laptop a `cover`-scaled backdrop puts cobblestone in the bottom ~225px, so the cups will not sit perfectly planted on stone at every viewport size. One tunable constant slides the image vertically to get it close.

### Build

1. **Asset handling**
   - Move `public/Piazza-inspo-image.png` → `public/background/piazza.png`; keep the untouched original in `image-source/` at the repo root — the same shipped-vs-source split already used for `public/audios/` vs `audio-source/`.
   - **Quantize to ~32 colours** with a one-off `sharp` script (`sharp` is already in `node_modules` via Next; the script is throwaway, not committed tooling). Three wins at once: 1.4 MB → likely <100 KB, the dither noise dies so it reads *more* like true pixel art, and it yields the fixed palette needed for later component work. Reversible — the original stays in `image-source/`.
   - **Not `next/image`** — its optimizer resamples and would soften the blocky edges. Plain `<img>`/CSS background plus `image-rendering: pixelated`, so upscaling to a 2560px screen stays crisp instead of smeary.

2. **`src/components/background/piazza-backdrop.tsx`** — a new directory, deliberately separate from `components/game/` (this is scenery: no state, no interaction, no game logic — `CLAUDE.md` §4).
   - Rendered in `layout.tsx` as a sibling *before* `{children}`, so it stays a Server Component (no `"use client"`) and sits entirely outside the game tree.
   - `fixed inset-0`, `-z-10`, `pointer-events-none`, `aria-hidden` — structurally incapable of intercepting a cup click or affecting layout.
   - **`game-board.tsx`, `cup-row.tsx`, `cup.tsx`, `use-monte-game.ts`: zero changes.** The scoreboard/audio pills stay pinned exactly where they are.
   - Z-tiers recorded once in the component's header comment: backdrop `-z-10` · game `z-0` · HUD pills `z-20`.

3. **Legibility scrim** — the sky is pale and the facades mid-tone, so dark text will fight the ochre. A second layer inside the backdrop component: a soft radial scrim, transparent at the edges, ~25% warm white at the centre, with its own tunable opacity constant. The pills already carry `border` + `backdrop-blur` and should survive unaided.

4. **Prepared for the dynamic parts** (two structural choices now, no extra work later):
   - **The backdrop renders an ordered list of layers, not one image.** Today that list has exactly one entry (the full PNG). Animating the clouds later = slice the sky out, add a `<Clouds />` entry. Nothing else changes.
   - **`src/lib/scene-constants.ts`** (pure data — `lib/` boundary respected): the image's native 1376×768 is the scene coordinate space, with anchors stored as **percentages** so they survive any scaling — `HORIZON_Y_CENTER` 72.1%, `HORIZON_Y_EDGE` 81.9%, `VANISHING_POINT_X` 50.1%, plus the clock-face centre (~57%, ~28%, to be measured properly when used). **The clock is the obvious first dynamic element** — two SVG hands overlaid at that anchor, requiring no image slicing at all.

**Done when:** the piazza sits behind the game, the cups read as being in the square, and lint + build are green.

**Verify live, specifically:**
- Cup clicks still register (the `pointer-events-none` guarantee, actually exercised).
- **The tell glint is still readable** — genuine risk, this one: a faint white dot on a cup over a busy textured backdrop is materially harder to spot than over a plain page. May need `TELL_GLINT_OPACITY` re-tuned, which is exactly why it's a single constant.
- Scoreboard and audio pills stay legible over the art.

**Built (2026-07-28), first pass live-checked good by Stefan; four follow-up changes made, not yet re-confirmed live:**

1. **Watermark removed from the source art.** The generated image had a small Gemini sparkle/diamond watermark sitting on the cobblestone near the bottom-right stair edge (measured bbox ~x1232–1279, y624–666 in the 1376×768 original). Fixed by patching over it with a clean cobblestone donor patch (sampled from elsewhere in the same image, same y-range so the brick-row phase lines up) rather than hand-drawing — the stair/brick pattern either side was already continuous, so the fix is invisible. New `image-source/piazza-clean.png` is the patched full-res master (the untouched Gemini output stays at `image-source/piazza-inspo-original.png`); `public/background/piazza.png` is now quantized from the clean version.
2. **Result pill opacity lowered.** `bg-green-600/10` → `/5`, `border-green-600/30` → `/15` (and the red equivalent) in `game-board.tsx` — less opaque per Stefan's request.
3. **New `src/components/game/table-platform.tsx`** — the table the cups sit on, replacing the old plain `border-b-2` floor line in `cup-row.tsx`. A flat, hard-edged 3-band bevel (light top lip / dark main face / near-black bottom shadow — no gradients, to match the pixel art's blocky shading rather than a smooth 3D look) plus two small paw shapes (palm + 3 toes, layered rounded divs) peeking out from underneath the front face. Colors are dark brown/near-black, deliberately close to the shadow tones already present in the piazza art. Geometry reuses `ROW_WIDTH`/`FLOOR_OVERHANG` from `game-constants.ts` so it still spans exactly what the old floor line did; all-new tunables (heights, colors, paw size/inset) are local constants in the new file, same pattern as `piazza-backdrop.tsx`.
4. **Whole game column nudged down.** `game-board.tsx`: the fixed top-left scoreboard/audio pills are unaffected (they're `position: fixed`, and deliberately kept *outside* the wrapper that moves, since a CSS transform on an ancestor would otherwise change their containing block and drag them down too — margin-top was used instead of transform for the same reason, and applied to a new inner wrapper, not the outer one). Title, cup row (with its new table+paws), result pill, and buttons all move down together via one `GAME_COLUMN_DROP_PX` constant (currently 72px) — a first estimate aiming for the paws to land near the top of the cobblestone (before it turns solid grey), not yet precision-tuned against a live viewport.

**Not yet done / open:** `GAME_COLUMN_DROP_PX` is a first guess, not measured against a live render — automated screenshot verification wasn't available in this session (Playwright's browser binary wasn't installed, and the install was declined), so this needs a live look and likely a small retune. Re-confirm all four changes live before considering this step done.

**Second live-feedback round (2026-07-28), Stefan sent a screenshot — four more changes made, not yet re-confirmed live:**

1. **"Press start to shuffle." removed** — the idle-phase status paragraph in `game-board.tsx` is gone; idle now shows nothing but the Start button, same reasoning Addendum 7 already applied to the other redundant status lines.
2. **Table extended further down + longer paws.** `TABLE_FRONT_HEIGHT_PX` (`table-platform.tsx`): 28px → 40px, so the platform reaches further toward the floor. `PAW_HEIGHT_PX`: 16 → 28, `PAW_TOE_SIZE_PX`: 6 → 8, `PAW_WIDTH_PX`: 22 → 26, and the peek fraction (how much of the paw shows below the front face) increased from 0.6 to 0.85× the paw's own height. Deliberately did **not** introduce a gap between the cup bottoms and the table's top — that would leave a strip of bare backdrop between them, reading as the cups floating just above the table rather than resting on it. "Move the table down" was read as "extend it further toward the floor," not "detach it from the cups."
3. **Table given real depth via a receding top face**, addressing "make it 3D, deeper into the screen, just like the buildings." New top band (`TABLE_TOP_DEPTH_PX` 20px, color `TABLE_TOP_COLOR` `#8B5A46`) is a trapezoid via `clip-path: polygon(...)` — narrower along its far/top edge (inset `TABLE_TOP_INSET_PERCENT`, 15%) than its near/bottom edge, sitting above the (renamed, same purpose) front face. This is the same convergence-toward-center device the backdrop's own building rooflines already use, and the table is already centered under the same vanishing point (`VANISHING_POINT_X_PERCENT`, `scene-constants.ts`), so it reads as consistent with the art rather than a bolted-on effect. The old flat 3px highlight sliver is gone, replaced by this top face. The polygon's cut corners deliberately expose the backdrop underneath — same visual logic as the gap beside a building's angled roof edge.
4. **Dry fountain added to the backdrop**, from Stefan's new `image-source/piazza-inspo-with-fountain.png` (same piazza, Gemini re-generated with a fountain added right of the clocktower). Since the two Gemini renders aren't pixel-identical outside the fountain either (~10.6% of sampled background pixels differ, even in areas with no fountain), a plain rectangular paste would've shown a visible seam. Instead: cropped a generous bounding box (795,430 to 1025,620) from both the fountain-less original and the fountain version, diffed them pixel-by-pixel within that box, and used the diff itself as an alpha mask — pixels that differ significantly (diff sum > 40) are "the fountain object" (the only thing intentionally different between the two renders) and get pasted; pixels that match stay transparent so our own already-watermark-patched backdrop shows through unchanged underneath. Composited onto `image-source/piazza-clean.png` (now the fountain-inclusive working master) before the final 32-color requantize, so the fountain shares the same palette pass as the rest of the scene rather than carrying its own mismatched quantization. The Gemini watermark in the new source image (same bottom-right spot as before) is well outside the crop box and was never at risk of being copied.
   - **Fountain's two side spouts measured for later water animation** (`scene-constants.ts`, `FOUNTAIN_LEFT_SPOUT_X/Y_PERCENT`, `FOUNTAIN_RIGHT_SPOUT_X/Y_PERCENT`): ~(63.2%, 66.0%) and ~(68.4%, 66.0%) of the backdrop image. Measured by eye off zoomed crops of the source at native resolution — good enough to anchor a future overlay, but re-verify precisely before actually building the water effect.

**Still open:** none of this second round has been watched live yet either — same screenshot-tooling gap as the first round (no Playwright browser binary installed this session). `GAME_COLUMN_DROP_PX`, the new table proportions, and the fountain's placement all want a real look before this step is called done.

**Terminology correction (2026-07-28):** Stefan clarified these are **table legs, not paws** — "paw" was Claude's naming choice, not a deliberate design decision. Corrected in code (`Leg` component, `LEG_*` constants) and in this doc from here on; the "paw"/"Paw" naming in earlier entries above is left as-is since it's a historical record of what was actually built at the time.

**Third live-feedback round (2026-07-28), Stefan sent a screenshot — table top's 3D read confirmed good; five more changes made, not yet re-confirmed live:**

1. **Whole game column pushed down further.** `GAME_COLUMN_DROP_PX` (`game-board.tsx`): 72px → 110px.
2. **Cup jitter's upward reach reduced.** `CUP_JITTER_RANGE_PX` (`game-constants.ts`): 9 → 5 (floor `CUP_JITTER_Y_MIN` unchanged at 2, so the range is now 2–5px instead of 2–9px) — so the per-cup wobble can no longer lift a cup far enough to look like it's floating clear of the table's top face, even with the table now sitting lower on the page.
3. **Legs tripled.** `LEG_WIDTH_PX` 26→78, `LEG_HEIGHT_PX` 28→84, `LEG_TOE_SIZE_PX` 8→24 (`table-platform.tsx`) — read literally as "triple the size," all three dimensions scaled uniformly rather than just lengthened, to keep the legs' proportions the same instead of turning them spindly.
4. **A second, shorter pair of legs added at the back.** New `LEG_BACK_INSET_PERCENT` (28%, vs the front pair's 14% — a narrower stance, same convergence-toward-center logic as the top face's own narrower far edge) and `LEG_BACK_LENGTH_PERCENT` (75% of the front legs' length). Rendered *before* the front legs in DOM order, so the front pair paints over them wherever they'd overlap — same as a real table's back legs would be partly hidden behind the front structure.
5. **Fountain moved further right, now clear of the game column.** Turned out the fountain's first placement (57.8%–74.5% of the image width) overlapped the centered game column's own footprint (roughly 32%–68%, for `ROW_WIDTH + FLOOR_OVERHANG×2` centered) — it was never cropped by the viewport, it was sitting *directly behind the opaque table*, which is why it never appeared in Stefan's screenshot. Rebuilt from scratch: fresh fountain-less watermark-patched master from the untouched original, same diff-mask cutout technique as before (unchanged — the fountain object's own source location didn't move, only where it gets pasted), composited 285px further right (new destination 1080,430, was 795,430). Requantized once, as before.
   - **Spout coordinates updated** in `scene-constants.ts` for the new position: `FOUNTAIN_LEFT_SPOUT_X_PERCENT` 63.2 → 83.9, `FOUNTAIN_RIGHT_SPOUT_X_PERCENT` 68.4 → 89.1 (Y unchanged at 66.0 — only a horizontal shift).

**Known caveat, still unresolved:** the game column's on-screen footprint is fixed-pixel CSS, while the backdrop scales via `background-size: cover` — so "does the fountain clear the game column" only holds exactly at the viewport width these percentages were reasoned against (Stefan's ~1917px-wide screenshot). At a meaningfully different viewport size the relationship between the two could shift. This is the same limitation flagged when Option A was chosen over the scene-box Option C; still deferred to Step 6's responsive pass.

**Still not watched live** — same tooling gap as the last two rounds.

**Fourth live-feedback round (2026-07-28), Stefan sent a screenshot of the table close-up — three code changes plus three explanation-only questions:**

1. **Leg overlap bug fixed.** The screenshot showed the toe circles sitting visibly overlapping the table's front face rather than hanging below it — traced to the `bottom: -heightPx * 0.85` formula on the `Leg` wrapper: with the wrapper's own height being `heightPx + LEG_TOE_SIZE_PX` (taller than just `heightPx`), that 0.85 fraction left far more than intended tucked up inside the table (specifically, the toes landed well inside the front-face band). Replaced with `LEG_ATTACH_OVERLAP_PX` (6px, fixed) — only that many pixels now tuck up behind the table's bottom edge for a clean attachment point; the rest of the leg (including the toes) hangs fully visible below.
2. **Legs lengthened another 50% and made thinner**, per Stefan's read of the same screenshot: `LEG_HEIGHT_PX` 84 → 126 (×1.5), `LEG_WIDTH_PX` 78 → 26, `LEG_TOE_SIZE_PX` 24 → 10 (both trimmed down for a slimmer look, not just literally "keep width, add length"). Back legs stay at 75% of whatever the front legs' height is (`LEG_BACK_LENGTH_PERCENT`, unchanged), so they scale with this too (94.5px).
3. **Result pill relocated into the top-left HUD stack**, below the audio controls pill, and restyled to match its new neighbors: `rounded-full border bg-background/80 px-4 py-1.5 text-sm ... shadow-sm backdrop-blur` (previously a much larger `text-2xl` centered banner under the cups) — win/loss is now signaled by a tinted border + text color (`border-green-600/40 text-green-600`, and the red equivalent) rather than a tinted background, so it still reads as opaque/consistent with the other two pills in that corner rather than a separate colored banner. The now-empty wrapper div under the cup row (previously holding this pill, and before that the removed "Press start..." text) is gone from `game-board.tsx` entirely.

**Explanation-only (no code changed), answered directly to Stefan rather than in this doc — see conversation.** Where to hand-tune the title's Y position, where the cups' base position and jitter are computed, and whether manually retouching `public/background/piazza.png` in Paint is safe.

**Still not watched live** — same tooling gap as every round so far this session.

---

## Step 7 — Deploy to Vercel ☐

(~30 min)

1. Push `main` to a GitHub repo (`CLAUDE.md` §12 — work directly on `main`).
2. Import the repo into Vercel. Framework auto-detects as Next.js; **no environment variables needed** — this app has no backend.
3. Verify the live URL: play a full round on the deployed site, on a phone.

**Done when:** the live URL works and a round plays correctly on a real phone.

> ### ⏸ PAUSE F — first prototype complete
> Confirm the deployed version behaves like local. Then decide what Step 8 becomes.

---

## Step 8 — Hidden operator override ☐ DEFERRED

**Not part of this prototype.** Deliberately postponed until the honest game exists and feels right, because the design decision depends on how the animation actually turned out.

**The open decision** (`CLAUDE.md` §2):
- **Pre-shuffle** — a secret input before the shuffle predetermines which cup wins. Simple: no new animation, just seeds the state. Low risk.
- **Post-guess** — the player picks, and a secret input retroactively makes a different cup the winner. Far more convincing as a trick, but needs a believable sleight-of-hand animation and is materially more work.

Also unresolved: the input mechanism itself (secret keypress, hidden click target, a specific click sequence).

**Decide at PAUSE F, not before.**

---

## Deliberately not doing

Recorded so these do not creep in mid-build:

- Backend, database, API routes
- Accounts, auth, persisted score
- Cross-device / remote control
- Difficulty settings or a settings UI
- Animation libraries

## Sound effects — brought into scope, implemented

Stefan explicitly moved sound into scope (superseding the earlier "deliberately not doing" entry and `CLAUDE.md` §2's old "Sound" exclusion, both now updated). Answers to the two design questions raised earlier in this doc (randomize per swap not per cup; rough-trim + runtime `playbackRate` stretch, not exact cuts) were carried straight into the implementation below.

**Files reorganized:**
- `public/audios/output/*` (spaces + commas in filenames, awkward to reference in code) renamed to `public/audios/swoosh-1.mp3` … `swoosh-6.mp3`, plus `swoosh-bonus.mp3` (was "swoosh 7, 780" — the longest clip).
- `public/audios/source/*` (the untrimmed originals, not used by the app) moved out of `public/` entirely to `audio-source/` at the repo root, so they stay in the project for reference without shipping as deployed static assets.

**New:**
- `SwooshClip`, `SWOOSH_CLIPS` (the 6 regular clips, each paired with its natural duration in ms), and `BONUS_SWOOSH_CLIP` in `game-constants.ts`.
- `src/hooks/use-swoosh-audio.ts` — preloads one `HTMLAudioElement` per clip on mount (avoids first-play decode latency), and exposes `planRandomSwoosh(targetDurationMs)` / `planBonusSwoosh()` (pick a clip + compute a `playbackRate`) separately from `play(plan)` (just plays it). Kept in `hooks/`, not `lib/`, since owning real `Audio` elements is a side effect.

**Wiring, in `use-monte-game.ts`:** a random clip is assigned per swap (never per cup — a fixed per-cup sound would let anyone listening, not just the operator, track a cup through the shuffle by ear, the same failure mode already fixed for jitter in Addendum 5). The bonus swap always uses `swoosh-bonus.mp3` at its natural, unstretched rate, since — per Stefan's reasoning — it's the one swap that plays alone with nothing after it to rush for.

**Performance — precompute per round, not per event (Stefan's question, answered yes):** `startRound()` already builds the whole round's step sequence up front — every `SwapStep`, the round's randomized `swapIntervalMs`, whether a bonus swap happens — before any of it plays. Extending that same pass to also decide, once per swap, which clip plays and at what `playbackRate` is a natural fit, not a new pattern: it keeps the `setTimeout` callback on the hot path (`run()`) doing only cheap, already-decided work (a state update + `audio.play()`), with no `Math.random()` or rate math happening inside the timer chain. Preloading every `Audio` element once on mount is the second half of the same idea — decode cost paid once at page load, never at first swap. Net effect: yes, smart, and cheap to build since it reuses the sequencer that already existed for the shuffle itself.

**Rate clamping:** actual clip lengths (136–780ms) vary far more than the swap pacing they're matched to (`SWAP_INTERVAL_MS_MIN`–`MAX`, 250–380ms) — stretching an exact fit would pitch-shift some clips 2–3x, well past the "small ratio" assumption in the original design answer. `playbackRate` is clamped to 0.75–1.4 instead; a clip's tail may run past the next swap's start, which just reads as overlapping shuffle noise rather than a per-swap sound effect. Not yet listened to live — worth a listen-test pass like the original design note flagged.

**Refinements after Stefan's first listen (2026-07-28), not yet re-tested live:**
- **No back-to-back repeats.** `use-monte-game.ts` now tracks the previous swap's clip (`previousSwooshSrc`) and passes it to `planRandomSwoosh(..., excludeSrc)` as an exclusion — the same clip can still recur later in the sequence, just never on two consecutive swaps. Scoped per round (resets to unset at the start of each `startRound()`), not carried across rounds.
- **Bonus swap never fires on the first round.** `hasBonusSwap` now also requires `!isFirstRound` — the player gets one honest shuffle before the game starts pulling extra tricks.
- **Audio controls pill**, `src/components/game/audio-controls.tsx`, rendered below the scoreboard pill (same fixed top-left corner, `flex-col gap-2`): a mute toggle (lucide `Volume2`/`VolumeX`) plus a volume slider. Volume/mute state lives in `useSwooshAudio` (not `GameSession` — it's an audio preference, not game state), backed by refs so a change takes effect on already-scheduled swaps mid-round, not just the next round. Default volume `DEFAULT_SWOOSH_VOLUME = 0.7` (`game-constants.ts`) — audible with headroom, not maxed (risk of clipping/startling on a phone/laptop speaker at a live table).
