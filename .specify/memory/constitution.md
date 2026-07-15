<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: n/a (first concrete adoption, all placeholders replaced)
- Added sections:
  - I. Locked Technology Stack
  - II. Physics-Accurate Ramming Combat
  - III. Static-Site, No-Backend Architecture
  - IV. Simplicity & YAGNI (Vanilla JS First)
  - V. Performance Budget (60 FPS Target)
  - Technology Constraints (expanded stack detail)
  - Development Workflow (build/deploy via GitHub Pages)
- Removed sections: none
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (generic "Constitution Check" gate, no stack-specific hardcoding — compatible as-is)
  - ✅ .specify/templates/spec-template.md (technology-agnostic by design — compatible as-is)
  - ✅ .specify/templates/tasks-template.md (path conventions are illustrative, adjusted per-feature — compatible as-is)
  - ⚠ No .specify/templates/commands/ directory found in this repo (skills-based install) — nothing to update
- Follow-up TODOs: none
-->

# car_combat Constitution

## Core Principles

### I. Locked Technology Stack

The project stack is LOCKED for the initial development phase and MUST NOT be
changed without a constitution amendment:

- **Rendering**: Three.js (WebGL)
- **Physics**: Rapier, using its raycast vehicle controller for cars
- **Build**: Vite
- **Language**: Plain JavaScript — TypeScript is explicitly OUT of scope at
  project start
- **Hosting**: GitHub Pages (static hosting only)
- **3D Assets**: `.glb`/`.gltf` loaded via `GLTFLoader`

Any feature plan proposing a different rendering engine, physics engine,
build tool, or hosting model MUST be rejected at the Constitution Check gate
unless this document is amended first. Introducing TypeScript, a backend
service, or a database is a stack change and requires the same amendment
process.

**Rationale**: A locked stack removes an entire class of decisions from every
feature plan, keeps the codebase consistent across contributors (human or
AI), and matches the project's actual constraints (static hosting on GitHub
Pages, no server to run business logic).

### II. Physics-Accurate Ramming Combat

Vehicle-to-vehicle collision damage MUST be derived from the physics
simulation, not scripted or faked. The baseline damage model is:

```
damage = relative_velocity × mass
```

Rapier's raycast vehicle controller MUST be the source of truth for vehicle
motion, suspension, and drift behavior. Gameplay code MAY tune coefficients
(e.g., a damage multiplier, minimum-impact threshold) but MUST NOT bypass the
physics engine's collision/velocity data to compute combat outcomes.

**Rationale**: Rapier was chosen specifically for collision accuracy and a
ready-made vehicle controller. Faking damage with arbitrary game-logic
numbers would defeat the reason this engine was selected and would make
ramming feel disconnected from actual vehicle speed and mass — the core
fantasy of the genre.

### III. Static-Site, No-Backend Architecture

The game MUST run entirely client-side and MUST be deployable as static
files to GitHub Pages. Features MUST NOT require:

- A server-side process (API server, game server, database)
- Build-time or runtime dependencies unavailable in a static-hosting context
- User accounts, authentication, or server-persisted state

Persistence (e.g., settings, high scores) MUST use browser-local mechanisms
(e.g., `localStorage`) when needed.

**Rationale**: GitHub Pages hosting is a fixed constraint. Designing for it
from the start avoids costly rework and keeps deployment to "push to the
Pages branch."

### IV. Simplicity & YAGNI (Vanilla JS First)

Code MUST be plain JavaScript (ES modules) with no TypeScript, no framework
(React/Vue/etc.), and no build-time abstraction beyond what Vite provides
out of the box. New dependencies beyond Three.js, Rapier, and Vite tooling
MUST be justified against a concrete, current need — not a hypothetical
future one. Prefer direct, readable code over premature abstraction layers
(e.g., no generic "entity component system" until the game actually needs
one).

**Rationale**: The project starts intentionally minimal to move fast and
keep the stack approachable. Complexity must be earned by real requirements,
not anticipated ones.

### V. Performance Budget (60 FPS Target)

The game MUST target a sustained 60 FPS on the primary development hardware
for the core gameplay loop (vehicle physics + rendering + combat). Any
feature with a measurable, non-trivial performance cost (particle effects,
additional vehicles, complex geometry) MUST state its expected frame-time
impact in the plan's Technical Context and MUST be validated against the
budget before merge.

**Rationale**: This is a real-time action game — frame rate directly
determines whether driving and combat feel responsive. A stated, testable
budget prevents performance regressions from accumulating silently.

## Technology Constraints

- Model/asset format is restricted to `.glb`/`.gltf`, imported via
  `GLTFLoader`. Other 3D formats (`.fbx`, `.obj`, etc.) MUST be converted to
  `.glb`/`.gltf` before being committed.
- All physics bodies representing vehicles MUST use Rapier's raycast vehicle
  controller rather than a custom hand-rolled controller, unless a
  documented Rapier limitation makes this impossible (captured under
  Complexity Tracking in the relevant plan).
- Build and dev tooling MUST go through Vite; no parallel/competing bundler
  may be introduced.

## Development Workflow

- Every feature is planned and specified using the Spec Kit workflow
  (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-implement`) before implementation begins.
- Every `/speckit-plan` run MUST include a Constitution Check confirming the
  feature stays within the Locked Technology Stack (Principle I) and the
  Static-Site, No-Backend Architecture (Principle III). Violations MUST be
  justified in the plan's Complexity Tracking section or the plan MUST be
  revised.
- Deployment is `git push` to the branch GitHub Pages serves from; there is
  no separate release/build pipeline beyond Vite's static build output.

## Governance

This constitution supersedes all other project practices and templates.
Amendments require:

1. A documented rationale for the change (what problem it solves).
2. An explicit version bump per semantic versioning:
   - **MAJOR**: Backward-incompatible governance changes or removal/
     redefinition of a principle (e.g., dropping the locked-stack rule).
   - **MINOR**: A new principle or materially expanded guidance.
   - **PATCH**: Wording clarifications with no semantic change.
3. Propagation of the change to any dependent templates
   (`.specify/templates/*.md`) in the same commit, when applicable.

All feature plans MUST verify compliance with this constitution at the
Constitution Check gate. Any complexity or deviation from a Core Principle
MUST be explicitly justified in the plan's Complexity Tracking table; plans
that cannot justify a deviation MUST be simplified instead.

**Version**: 1.0.0 | **Ratified**: 2026-07-15 | **Last Amended**: 2026-07-15
