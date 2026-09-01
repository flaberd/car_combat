# Documentation Workflow

This document defines when documentation should be read, updated, or created.
For writing and linking rules, see [Documentation Style](style.md).

---

## Before Starting a Task

1. Read `docs/AI_CONTEXT.md`.
2. Read `docs/index.md` to identify relevant documentation.
3. Read only the documentation relevant to the current task.
4. Do not scan the entire `docs/` directory unless explicitly required.

---

## Choosing a Documentation Location

Place new documents in the area that matches their primary responsibility:

- `docs/features/` for player-facing game behavior and flows (a system the
  player directly experiences: driving, combat, controls, UI).
- `docs/architecture/` for module responsibilities, boundaries, and how
  systems (physics, rendering, input, combat) fit together.
- `docs/decisions/` for locked technical/design decisions (ADRs) — things a
  future feature MUST NOT casually contradict without amending the decision.
- `docs/documentation/` only for documentation rules, workflow, style, and
  templates.
- `docs/todo/` only for temporary knowledge gaps and missing documentation
  notes.

Create an area folder only when adding its first real document.

---

## If Documentation Exists

Before changing behavior:

1. Read the relevant documentation.
2. Verify that the implementation matches the documented behavior.
3. If behavior intentionally changes, update the documentation.

---

## If Documentation Does Not Exist

1. Inspect the implementation.
2. Infer only behavior directly supported by the code.
3. Never invent undocumented game-design rules (balance numbers, mechanics).
4. If needed, create a small draft document.
5. Record uncertainties in `docs/todo/knowledge-gaps.md`.
6. If needed documentation cannot be completed, record it in
   `docs/todo/missing-docs.md`.

---

## After Completing a Task

If the task changes:

- game design or player-facing behavior;
- controls or input handling;
- combat/balance rules;
- architecture or module boundaries;
- a locked decision (requires an explicit amendment — see
  [Decision Template](templates/decision.md));

then update the related documentation before considering the task complete.

If the documentation update cannot be completed in the current task, add a
short note to `docs/todo/missing-docs.md`.

---

## Related Documents

- [AI Context](../AI_CONTEXT.md)
- [Documentation Index](../index.md)
- [Documentation Style](style.md)
