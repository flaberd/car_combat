# Documentation Style

This document defines how documentation should be written, linked, and
structured.

For task-level documentation workflow, see
[Documentation Workflow](workflow.md).

---

# General Principles

Documentation should:

- be concise;
- be easy to navigate;
- be easy to maintain;
- remain independent from implementation details whenever possible;
- evolve together with the project.

Prefer many small focused documents over large documents.

---

# What to Document

Document:

- game design rules (mechanics, balance, controls);
- player-facing behavior and flows;
- locked technical/architectural decisions;
- module responsibilities and boundaries;
- known limitations;
- important constraints.

Do not document:

- obvious Three.js/Rapier/Vite behavior;
- framework/library internals;
- function-by-function implementation details;
- implementation that is already obvious from reading the code.

---

# Links

Use relative Markdown links for all internal documentation.

Example:

```md
[Combat System](../features/combat-system.md)
```

Real links in prose, navigation lists, and related-document sections should
point to existing files unless the text is explicitly recording missing
documentation.

---

# Cross-Referencing

Documentation should form a connected knowledge graph.

When a documented concept references another documented concept, create a
Markdown link instead of plain text whenever it improves navigation.

Prefer links between concepts over repeating information.

---

# Related Document Sections

Whenever appropriate, documents should end with:

```md
## Related Documents

- [Core Vehicle Loop](../features/core-vehicle-loop.md)
- [Locked Technology Stack](../decisions/001-locked-technology-stack.md)
```

Only link documents that have a meaningful relationship.

Avoid unrelated links added only to increase the number of references.

---

# Navigation Through Documentation

Documentation should help readers answer three questions quickly:

- What is this?
- Why does it exist?
- Where is it implemented?

Do not explain the implementation itself. Instead, point readers to the
relevant implementation.

---

# Implementation Entry Points

Feature and architecture documentation should contain an "Implementation
Entry Points" section whenever applicable.

Example:

```md
## Implementation Entry Points

Systems

- `src/combat/ramming.js`
- `src/combat/targeting.js`

Config

- `src/config/tuning.js` (`ARCHETYPES`, `WEAPONS`)

Tests

- `tests/unit/ramming.test.js`
```

The purpose of this section is navigation. Do not explain every function.

---

# Document Size

Prefer small focused documents.

If a document becomes too broad:

- split it into multiple documents;
- connect them with links.

Avoid large monolithic documents.

---

# Writing Style

Write:

- short sections;
- explicit rules;
- concrete examples;
- factual statements.

Avoid:

- assumptions;
- opinions;
- duplicated information;
- unnecessary repetition;
- implementation details that are already obvious from the code.

---

# File Naming

Use lowercase filenames.

Separate words with hyphens.

Examples:

- `combat-system.md`
- `mobile-touch-controls.md`
- `locked-technology-stack.md`

Decision records are additionally prefixed with a zero-padded sequence
number (`001-`, `002-`, ...) so their creation order is visible in a
directory listing.

Avoid spaces in filenames.

---

# Orphan Documents

Documentation should always be discoverable.

When creating a new document:

- add links from related documents when appropriate;
- update `docs/index.md` when the document should be a primary navigation
  entry or introduces a new documentation area.

Never leave documentation disconnected from the rest of the knowledge base.

---

# Related Documents

- [AI Context](../AI_CONTEXT.md)
- [Documentation Index](../index.md)
- [Documentation Workflow](workflow.md)
