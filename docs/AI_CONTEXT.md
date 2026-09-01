# AI Context

## Purpose

This repository contains the implementation of Car Combat, a browser-based
vehicle combat game (vintage car-combat genre: physics-driven ramming,
weapons, arena elimination).

The goal of this documentation is not to describe the codebase, but to
provide the source of truth for game design, architecture, and locked
technical decisions.

Documentation should explain **why** the game behaves the way it does, not
simply mirror the implementation.

---

## Source of Truth

The source of truth for the project is:

1. Design/architecture documentation inside `docs/`
2. The current implementation

When documentation and implementation disagree:

- assume the implementation reflects the current behavior;
- verify whether the documentation is outdated;
- update the documentation if the implementation intentionally changed.

Never invent undocumented game-design rules.

---

## Documentation Navigation

After reading this file, use `docs/index.md` to find only the documentation
relevant to the current task.

- `docs/index.md` is the documentation map.
- `docs/documentation/workflow.md` defines when to read, update, or create documentation.
- `docs/documentation/style.md` defines how documentation should be written and linked.

---

## Development Principles

When making changes, prioritize in this order:

1. Game design / player experience
2. Locked technical decisions (`docs/decisions/`)
3. Architecture consistency
4. Code quality

Implementation should support the design, not define it.

---

## Documentation Goals

The documentation should allow a new developer or AI agent to:

- understand how the game works;
- understand why important design and technical decisions were made;
- implement new features consistently with the locked stack and core loop;
- maintain existing systems without guessing design intent.

The documentation grows incrementally, alongside the tasks that touch each
area — it is not written all at once for the whole game. It should remain
easy to navigate and inexpensive for AI agents to use.

---

## Migration Note

This project previously used the Spec Kit workflow (`.specify/`, `specs/`,
`speckit-*` skills). That workflow has been replaced by this docs/ system.
Design decisions and specs from that workflow were migrated into
`docs/decisions/` and `docs/features/` — see those documents for the
original rationale.
