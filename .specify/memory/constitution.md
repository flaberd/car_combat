<!--
Sync Impact Report
- Version change: 1.1.0 → 1.2.0
- Modified principles: none; Core Principles I–VII unchanged
- Modified sections:
  - Platform & Controls: touch/mobile browser play is now in MVP scope
    (previously deferred entirely pre-MVP). Added input-method
    auto-detection requirement, a concrete touch control scheme (dual
    virtual joysticks + buttons, mirroring the existing twin-stick
    InputState abstraction), and a landscape-only mobile orientation
    requirement with a rotate-device prompt for portrait. Native app
    packaging via Capacitor remains deferred/out of scope — distinct from
    in-browser touch play.
- Added sections: none new (amendment within existing Platform & Controls)
- Removed sections: none
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (generic "Constitution Check" gate — compatible as-is)
  - ✅ .specify/templates/spec-template.md (technology-agnostic — compatible as-is)
  - ✅ .specify/templates/tasks-template.md (illustrative path conventions — compatible as-is)
  - ⚠ No .specify/templates/commands/ directory found in this repo (skills-based install) — nothing to update
- Follow-up TODOs (carried over, unchanged by this amendment):
  - TODO(VEHICLE_ARCHETYPES): archetype design (heavy/light/balanced) deferred —
    risk: unchecked ramming power can make shooting irrelevant.
  - TODO(WEAPON_BALANCE): concrete weapon stats (damage, cooldown, range) deferred
    per weapon (rockets, homing rockets, mines, oil slick).
  - TODO(RAM_VS_SHOOT_BALANCE): quantified risk/reward balance between ramming
    and shooting deferred to feature-level spec/plan work.
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

### VI. Core Loop Lock (Ram/Shoot Parity, Lock-Core-Loop-First)

Ramming and shooting MUST be treated as co-equal core combat mechanics —
neither may be implemented, tuned, or shipped in a way that makes the other
irrelevant. Drift and turbo-boost are core control mechanics, not optional
flourishes, and MUST be present from the first driveable prototype.

Work MUST follow a "lock core loop first" sequencing: the core
drive/drift/turbo/ram/shoot loop MUST be functional and stable before any
effort goes into art style, setting, audio, or cosmetic polish. Features that
only affect presentation (not the core loop) MUST be sequenced after the
loop is locked, unless they are required as grey-box placeholders to make
the loop testable.

**Rationale**: This is a physics-and-combat-feel game — if the core loop
isn't fun and balanced, no amount of art or content fixes that. Sequencing
protects against sinking effort into presentation before the mechanics that
define the genre are proven.

### VII. MVP Scope Discipline

The MVP is single-player against bots, in a single arena-elimination match
format (last-vehicle-standing, no respawns). A feature plan MUST NOT expand
into any item listed under Non-Goals (below) without a constitution
amendment first. When a feature's natural design would touch a non-goal
(e.g., a networking hook for future multiplayer), the plan MUST scope it out
explicitly rather than partially building it "for later."

**Rationale**: Non-goals were chosen deliberately to keep the MVP shippable.
Silently expanding scope (even a little "future-proofing") is how MVPs stop
being minimal.

## Platform & Controls

- **Target platform**: browser (WebGL), statically hosted on GitHub Pages —
  both desktop and mobile browsers are in scope.
- **Future mobile path**: packaging as a native app via Capacitor remains a
  possible future direction and MUST NOT be built now — it is explicitly
  out of MVP scope (see Non-Goals). This is distinct from mobile *browser*
  play, which is in scope (see Touch Controls below).
- **Development context**: this project is developed with Claude Code,
  including from mobile, using the Spec Kit spec-driven workflow (see
  Development Workflow below).
- **Camera**: 3D third-person.
- **Control scheme**: twin-stick (movement + aim/fire as independent axes),
  shared across input methods via a single InputState abstraction
  (`moveAxis`, `aimAxis`, `drift`, `turbo` — see
  `specs/001-core-vehicle-loop/data-model.md`).
- **Core control mechanics**: drift and turbo-boost are core to vehicle
  control (Principle VI) and MUST be present in the first driveable
  prototype, not deferred as polish.
- **Input-method auto-detection**: the game MUST automatically detect
  whether the player is using a touch device or keyboard/mouse and enable
  the matching control scheme accordingly. No manual control-scheme toggle
  is required for MVP.
- **Touch controls**: in scope for MVP (browser-based; gamepad support
  remains deferred/out of scope). Touch input MUST reuse the existing
  twin-stick InputState abstraction rather than introduce a second control
  paradigm:
  - A left virtual joystick drives `InputState.moveAxis` (drive + steer).
  - A right virtual joystick is present but unbound in this scope, reserved
    for a future aim/fire feature exactly like `aimAxis` on keyboard.
  - Drift and turbo are on-screen touch buttons (discrete/held actions, not
    axis-like), mirroring the keyboard's Space/Shift bindings.
- **Mobile orientation**: touch/mobile play is landscape-only. When a touch
  device is in portrait orientation, the game MUST block gameplay and
  display a prompt asking the player to rotate to landscape, rather than
  attempting to render/play in portrait.

## Match Format

- **Mode**: single arena, elimination — last vehicle standing wins.
- **Respawns**: none. Elimination is permanent within a match.
- **Multiplayer** (online or local split-screen): out of MVP scope (see
  Non-Goals). Match/game-state code MAY be written in a way that doesn't
  actively preclude multiplayer later, but no multiplayer-specific work
  (netcode, split-screen viewport/input handling) happens pre-MVP.

## Combat System

- Ramming and shooting are co-equal core mechanics (Principle VI). Ramming
  damage MUST follow Principle II (`damage = relative_velocity × mass`).
- **Weapon roster** (names locked for MVP scope; balance values are open —
  see Open Design Questions):
  - Rockets (direct-fire projectile)
  - Homing rockets (target-seeking projectile)
  - Mines (deployable, triggered by proximity/contact)
  - Oil slick (ground-deployed decal that modifies surface friction in its
    area)
- Weapon damage, cooldown, range, and other balance numbers are explicitly
  NOT locked by this constitution and MUST be defined at the feature
  spec/plan level, informed by playtesting.

## Destructible Objects

- Environment objects (buildings/decorations) that respond to combat MUST
  use simple HP-threshold visual states — 2 to 3 states (e.g., intact →
  damaged → destroyed) — swapped by HP threshold.
- Objects MUST NOT implement physical destruction (no fracturing, physics
  debris, or dynamic mesh breakup). This is an explicit non-goal.
- **Rationale**: visual-state swapping delivers the "things can be wrecked"
  feedback the genre needs at a small fraction of the implementation cost of
  physical destruction, in line with Principle IV (Simplicity & YAGNI).

## Visual Approach

- The project starts and stays grey-box / art-agnostic until the core loop
  is locked (Principle VI). Final art style and setting are explicitly
  deferred decisions, not to be resolved by feature work before then.
- Grey-box assets still MUST go through the locked asset pipeline
  (`.glb`/`.gltf` via `GLTFLoader`, Principle I) — "grey-box" describes
  visual fidelity, not a different asset format or loading path.

## MVP Scope & Non-Goals

**MVP scope**: single-player vs. bots, one arena, elimination format, core
drive/drift/turbo/ram/shoot loop, grey-box visuals.

**Explicitly out of scope (non-goals)** — MUST NOT be built without a
constitution amendment first:

- Online multiplayer
- Local split-screen multiplayer
- TypeScript (at project start — see Principle I)
- Sound/music
- Final art style/setting
- Physical destruction of environment objects

## Open Design Questions (Deferred)

These are known-open questions, intentionally deferred rather than decided
here. They MUST be resolved at the relevant feature spec/plan stage, not
silently assumed:

- **Vehicle archetypes** (e.g., heavy/light/balanced): not yet designed.
  Known risk: an unchecked strong ramming archetype with no counterplay
  could make shooting irrelevant, violating Principle VI's ram/shoot parity
  requirement — archetype design MUST address this risk explicitly.
- **Weapon balance**: concrete damage, cooldown, and range values for each
  weapon in the roster are not yet defined.
- **Ram vs. shooting balance**: the quantified risk/reward tuning between
  ramming and shooting is not yet defined.

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
- Capacitor (for a future mobile build) is a noted future direction only —
  it MUST NOT be added as a dependency or build target until a constitution
  amendment moves mobile packaging into scope.

## Development Workflow

- Every feature is planned and specified using the Spec Kit workflow
  (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-implement`) before implementation begins. This project follows
  spec-driven development (SDD) as its primary working method.
- Feature specs MUST include acceptance criteria and a vertical-slice
  breakdown (independently testable, prioritized user stories/slices, per
  the spec template). Specs MUST NOT contain open-ended design discussion —
  open questions belong in this constitution's Open Design Questions section
  or in the plan's Complexity Tracking, not as unresolved prose in a final
  spec.
- Every `/speckit-plan` run MUST include a Constitution Check confirming the
  feature stays within the Locked Technology Stack (Principle I), the
  Static-Site, No-Backend Architecture (Principle III), and MVP Scope
  Discipline (Principle VII). Violations MUST be justified in the plan's
  Complexity Tracking section or the plan MUST be revised.
- Sequencing follows "lock core loop first" (Principle VI): core-loop
  features are prioritized over presentation/polish features.
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

**Version**: 1.2.0 | **Ratified**: 2026-07-15 | **Last Amended**: 2026-07-15
