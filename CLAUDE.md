@AGENTS.md

# Claude Development Guide — Balletje-Balletje

## 1. Project Purpose

A small, fun web version of **balletje-balletje** (three-card monte / the shell game).

Three cups, one ball, a shuffle, and a guess. The player watches the shuffle and picks a cup.

The twist: **the house can know, and eventually control, where the ball is.** This is not a fair game — it is a party trick with a screen instead of a street table.

## 2. Goal & Scope

**Goal:** a polished-feeling toy that runs in a browser and is genuinely fun to put in front of friends.

**Context of use:** a live, one-screen party trick. Claude (the operator/host) and the audience look at the *same* screen. Nobody plays remotely.

**Size:** 1 day preferred, 3 days maximum. This is a toy, not a product. Scope discipline matters more than feature completeness.

**In scope (first prototype):**
- 3 cups, animated shuffle, pick, reveal
- Running win/loss score across rounds
- A **visual tell**: the winning cup carries a barely-perceptible art difference, so the operator always knows where the ball is
- **Swap sound effects**: a random swoosh clip per cup swap (see `src/lib/game-constants.ts` `SWOOSH_CLIPS`/`BONUS_SWOOSH_CLIP`, `src/hooks/use-swoosh-audio.ts`) — brought into scope explicitly by Stefan; see `development-plans/first-prototype.md` for the design rationale
- Deployed on Vercel

**Explicitly out of scope (for now):**
- Any backend, database, or API
- Accounts, auth, persistence across sessions
- Multiplayer or cross-device control

**Deferred, decision pending:** a hidden operator override (secret key/click) that lets the host *force* the outcome, superseding the passive visual tell. Whether it fires pre-shuffle (predetermine the winner) or post-guess (retroactive switcheroo) is **undecided** — to be chosen after the honest game feels right, because the post-guess version is materially more animation work.

## 3. Core Principles

- **Simplicity over cleverness.** Every abstraction must earn its place. This project is small.
- **Modularity where it pays.** Pure logic separated from state, state separated from UI — but do not over-split a 3-cup game into 15 files.
- **Clarity.** No hidden logic *in the code*. (Hidden logic *in the game* is the entire point — but it should be obvious in the source where it lives.)
- **Control.** The operator's advantage must be reliable and easy to tune in one place.
- **Ship it.** Prefer a working, deployed, slightly rough version over an unfinished elegant one.

## 4. Non-Negotiable Rules

### No backend
This app is **100% client-side**. No API routes, no database, no server calls, no environment secrets. If a feature seems to need a backend, stop and ask — it is probably out of scope.

### State
- **React state is the single source of truth.**
- **Session state is one object**, not several independent `useState` calls. Do not split it.
- No `localStorage` in the first prototype. Score resets on reload — that is fine and intentional.
- `useRef` is allowed alongside `useState` when a value must be read synchronously in a callback or timer immediately after a state update (React batching would otherwise read a stale closure). Update the ref in the same call that calls `setState`, never inside a `setState` updater.

### Cup identity vs. cup position
This distinction is the backbone of the whole game — do not blur it.
- A cup has a **stable `id`** that never changes.
- A cup's **position** (slot 0, 1, 2) is derived from its index in the order array.
- Render cups keyed by `id`, positioned by index. Reordering the array is what animates them.
- Never key a cup by its index. Doing so breaks both the animation and the tell.

### Animation
- All movement is **CSS transitions on `transform`**. No animation library (no Framer Motion, no GSAP).
- Cups are absolutely positioned; movement is `translateX` to a slot coordinate.
- Never animate `left`/`top`/margins — `transform` only, for smoothness.

### Timers
- Any `setTimeout`/`setInterval` driving the shuffle **must be cleaned up** on unmount and on round reset. A leaked timer that fires into a reset round is the most likely bug in this codebase.

### The secret
- The tell (and any future override) lives in **one clearly-marked place**, tunable without hunting through components.
- **Accepted limitation:** because this is client-side, anyone with devtools can read the game state and find the ball. That is fine for a party trick and is not a bug to fix. Do not add obfuscation — it is wasted effort at this scope.

### Architecture boundaries
- `src/lib/` — pure functions and types. No React, no state, no side effects.
- `src/hooks/` — game state, session logic, timers, side effects.
- `src/components/` — rendering and user interaction only. No game logic.
- `src/components/ui/` — shadcn primitives. Treat as vendored; edit only when genuinely needed.

Do not mix these responsibilities.

## 5. Architecture Overview

```
lib/ (pure: types, shuffle sequence)
  ↓
hooks/use-monte-game.ts (session state, phases, timers)
  ↓
components/game/* (cups, scoreboard, controls)
  ↓
app/page.tsx (assembly)
```

**Session state shape** (one object):

```ts
{
  phase: 'idle' | 'shuffling' | 'guessing' | 'revealed',
  order: CupId[],        // index = slot position
  ballCupId: CupId,      // which cup holds the ball (travels with the cup)
  pickedCupId: CupId | null,
  score: { wins: number; losses: number },
}
```

The ball belongs to a **cup**, not to a slot — it travels with its cup through the shuffle, exactly like the real game. This is why the visual tell falls out for free: the winning cup is a stable identity that can carry its own styling.

## 6. Naming Conventions

- **Files:** kebab-case (`use-monte-game.ts`, `cup-row.tsx`)
- **Components:** PascalCase (`CupRow`, `Scoreboard`)
- **Hooks:** `useX` (`useMonteGame`)
- **Pure logic modules:** descriptive, no `use-` prefix (`shuffle.ts`, `game-types.ts`)
- **Handlers:** `handleX` · **Prop callbacks:** `onX`
- **Constants:** `SCREAMING_SNAKE_CASE`, grouped in one constants module

Do not introduce inconsistent naming.

## 7. Component Guidelines

- Keep components cohesive; do not over-split a small game.
- Prefer existing shadcn primitives before writing new ones.
- No game logic inside UI components — they receive state and emit events.
- Next.js App Router: components are Server Components by default. The game is interactive, so it needs `"use client"`. Keep the client boundary as low in the tree as is practical without contorting the code.

## 8. Error Handling

- Log to console during development.
- Never write an empty `catch {}` — either a comment explaining why it is safe to ignore, or `console.error`.
- No user-facing error system. This is a toy; keep handling minimal.

## 9. AI Behavior Rules

When generating or modifying code:
- **If anything is unclear → ask first.**
- Make minimal changes only.
- Do not refactor unrelated code.
- Do not rewrite whole files unless explicitly asked.
- Follow existing patterns strictly; prefer consistency over "better" alternatives, but may present an alternative as an option.
- Briefly explain key logic. No long explanations.
- **Follow the agreed plan in `development-plans/first-prototype.md` and stop at its pauses.** Do not run ahead to the next step because it seems obvious.
- **This is Next.js 16** — APIs and conventions may differ from training data. When unsure, read `node_modules/next/dist/docs/` rather than guessing (see `AGENTS.md`).

## 10. Modification Rules

- Change only what is requested.
- Do not restructure surrounding logic.
- Do not rename variables or components unnecessarily.
- Do not introduce new abstractions without clear need.

## 11. Anti-Patterns (DO NOT DO)

- ❌ Adding a backend, API route, or database
- ❌ Splitting session state into multiple independent states
- ❌ Keying cups by array index instead of stable `id`
- ❌ Reaching for an animation library instead of CSS transitions
- ❌ Animating `left`/`top` instead of `transform`
- ❌ Leaving shuffle timers uncleaned on reset/unmount
- ❌ Putting game logic inside components
- ❌ Scattering the tell/override across multiple files
- ❌ Building a "god component" that holds state, logic, and markup
- ❌ Gold-plating — this is a 1–3 day toy

## 12. Workflow

Commands (project root):
- `npm run dev` — Next.js dev server
- `npm run build` — production build (includes type-check)
- `npm run lint` — ESLint
- `npm start` — serve the production build

**No test runner is installed.** This is deliberate for the first prototype: the game is verified by playing it in the browser, not by unit tests. If the shuffle logic gets hairy, adding Vitest for `lib/` only is the sanctioned escape hatch — ask first.

**Verification:** always verify by running the app and playing a round. Types and lint passing is not evidence that the shuffle looks right.

**Deploy:** Vercel, from the repo. Static/client-only — no environment variables to configure.

**Git:** work directly on `main`. No feature branches unless explicitly asked.

## 13. Current State

Scaffolding complete: Next.js 16 (App Router, TypeScript, Tailwind v4, `src/`), shadcn/ui initialized with `button` and `card`. Production build verified. No game code yet.

Active plan: `development-plans/first-prototype.md`.
