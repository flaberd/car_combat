# Documentation Index

This directory contains the project's knowledge base.

Start here after reading `AI_CONTEXT.md`.

Use this index to find relevant documentation. Do not treat it as a
checklist to read every linked file.

---

# Core Documents

- [AI Context](AI_CONTEXT.md) - project purpose, source of truth, and documentation goals.
- [Documentation Workflow](documentation/workflow.md) - when to read, update, or create documentation.
- [Documentation Style](documentation/style.md) - how documentation should be written and linked.

---

# Folder Structure

Use this as the canonical documentation structure:

```text
docs/
  AI_CONTEXT.md
  index.md

  documentation/
    style.md
    workflow.md
    templates/
      feature.md
      architecture.md
      decision.md

  features/
  architecture/
  decisions/

  todo/
    knowledge-gaps.md
    missing-docs.md
```

Area folders should be created when the first real document in that area is
added. Do not add empty folders or `.gitkeep` files only to reserve
structure.

---

# Documentation Areas

## Features

Player-facing game behavior and flows.

- [Core Vehicle Loop](features/core-vehicle-loop.md)
- [Combat System](features/combat-system.md)
- [Mobile Touch Controls](features/mobile-touch-controls.md)

---

## Architecture

Module responsibilities and boundaries.

- [Module Overview](architecture/module-overview.md)

---

## Decisions

Locked technical/design decisions (ADRs), migrated from the former
`.specify/memory/constitution.md`.

- [Locked Technology Stack](decisions/001-locked-technology-stack.md)
- [Physics-Accurate Ramming Combat](decisions/002-physics-accurate-ramming.md)
- [Static-Site, No-Backend Architecture](decisions/003-static-site-no-backend.md)
- [Simplicity & YAGNI](decisions/004-simplicity-and-yagni.md)
- [Performance Budget](decisions/005-performance-budget.md)
- [Core Loop Lock](decisions/006-core-loop-lock.md)
- [MVP Scope Discipline](decisions/007-mvp-scope-discipline.md)

---

## Documentation System

Reusable templates for maintaining this knowledge base.

- [Feature Documentation Template](documentation/templates/feature.md)
- [Architecture Documentation Template](documentation/templates/architecture.md)
- [Decision Documentation Template](documentation/templates/decision.md)

---

## Documentation Todo

Known documentation gaps and follow-up notes.

- [Knowledge Gaps](todo/knowledge-gaps.md)
- [Missing Documentation](todo/missing-docs.md)

---

# Documentation Coverage

| Area | Status |
|-------|--------|
| Features | Covered (3/3 known systems) |
| Architecture | Covered (module map) |
| Decisions | Covered (7 ADRs) |

The coverage table should be updated as documentation grows.
