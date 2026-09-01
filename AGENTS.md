# AGENTS.md

## Project Overview

Car Combat — a browser-based vehicle combat game inspired by vintage
car-combat games: physics-driven ramming, weapons, arena elimination.

## Tech Stack

- Three.js (WebGL rendering)
- Rapier (`@dimforge/rapier3d-compat`) — physics, raycast vehicle controller
- Vite — build/dev server
- Plain JavaScript (ES modules) — no TypeScript, no UI framework
- Vitest — unit tests
- GitHub Pages — static hosting only, no backend

This stack is locked — see
[Locked Technology Stack](docs/decisions/001-locked-technology-stack.md).

## Source of Truth / Documentation

Project documentation lives in:
- `docs/AI_CONTEXT.md`
- `docs/index.md`
- `docs/features/`
- `docs/architecture/`
- `docs/decisions/`

Before making game-design, architecture, or balance/tuning changes:
1. Read `docs/AI_CONTEXT.md`.
2. Read only the documentation relevant to the current task.
3. Do not scan the entire `docs/` directory by default.
4. Follow links from `docs/index.md` only when needed.
5. If relevant documentation is missing, inspect the existing code first.
6. Do not assume undocumented game-design rules or balance numbers.
7. If the task changes game design, balance/tuning, architecture, or a
   locked decision, update or create the relevant documentation.
8. If full documentation cannot be completed, add a short note to
   `docs/todo/missing-docs.md`.

## Repository Structure

- `src/vehicle` - vehicle physics, drift, turbo
- `src/combat` - ramming, weapons, pickups, targeting, placeholder bot AI
- `src/input` - keyboard and touch input, mapped to a shared `InputState`
- `src/physics` - Rapier world setup
- `src/arena` - grey-box arena geometry
- `src/camera` - follow camera
- `src/ui` - HUD, health bars, touch control styling
- `src/config/tuning.js` - all balance/tuning constants, centrally editable
- `tests/unit` - Vitest unit tests
- `docs` - source of truth for game design, architecture, and locked decisions

## Balance/Tuning Changes

- All balance numbers (archetype stats, weapon stats, ramming coefficient,
  pickup respawn delay, drift/camera values) live in `src/config/tuning.js`.
  Do not hardcode a balance number anywhere else.
- Ramming damage MUST be derived from Rapier's physics data (speed × mass),
  never scripted — see
  [Physics-Accurate Ramming Combat](docs/decisions/002-physics-accurate-ramming.md).

## Important / Forbidden

- Ask before adding new third-party packages via npm.
- Do not introduce TypeScript, a UI framework, or a backend/database — see
  [Locked Technology Stack](docs/decisions/001-locked-technology-stack.md)
  and [Static-Site, No-Backend Architecture](docs/decisions/003-static-site-no-backend.md).
- A feature that touches an item under Non-Goals in
  [MVP Scope Discipline](docs/decisions/007-mvp-scope-discipline.md)
  (multiplayer, sound/music, final art, physical destruction, gamepad,
  native app packaging, etc.) needs that decision amended first — do not
  build it "for later" as a side effect of another task.
- Never expose API keys, tokens, secrets, or credentials in code, logs,
  docs, or commits.
- Run `npm test` before considering a task done. There is no configured
  linter/formatter in this repo at present.

## Documentation Workflow

Use documentation as living source of truth.

When working on a feature or system:
1. Check if a related doc exists in `docs/features/` or `docs/architecture/`.
2. If it exists, read it before changing code.
3. If it does not exist, inspect the code and create a small draft only if
   the change needs it.
4. Prefer small focused documentation updates over large rewrites.
5. Document game-design rules, balance values, player-facing flows, and
   locked decisions. Do not document obvious Three.js/Rapier/Vite behavior.
6. A locked decision in `docs/decisions/` is not casually overridden — a
   change that contradicts one needs that decision amended in the same
   change, with rationale.

## Task Completion Checklist

Before considering a task complete:
- Relevant tests pass (`npm test`).
- Related documentation was checked.
- Documentation was updated if game design, balance, or architecture changed.
- No secrets or environment-specific values were added.
