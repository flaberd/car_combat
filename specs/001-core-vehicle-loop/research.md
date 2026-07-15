# Phase 0 Research: Core Vehicle Movement Loop

## 1. Rapier package variant for a Vite + GitHub Pages target

**Decision**: Use `@dimforge/rapier3d-compat`.

**Rationale**: This package embeds its WASM binary as base64 directly in the
JS bundle, so it works with Vite out of the box (`await RAPIER.init()` before
first use) with no bundler plugin configuration. The non-compat
`@dimforge/rapier3d` package requires `vite-plugin-wasm` and
`vite-plugin-top-level-await` plus attention to WASM MIME-type serving —
unnecessary complexity for a static GitHub Pages deployment where we don't
control server MIME configuration. This matches the constitution's
Simplicity & YAGNI principle (Principle IV): pick the option that needs zero
extra build tooling.

**Alternatives considered**: `@dimforge/rapier3d` (non-compat) — rejected,
adds two extra Vite plugins and WASM-serving considerations for no benefit
at this project's scale.

## 2. Vehicle physics: Rapier's raycast vehicle controller

**Decision**: Use Rapier's `DynamicRayCastVehicleController`
(`world.createVehicleController(chassisRigidBody)`), configured with one
raycast wheel per corner of the chassis. Per-frame, engine force and
steering angle are driven from input state, and the controller is stepped
alongside the physics world.

**Rationale**: This is the exact controller named in the constitution
(Principle I: "raycast vehicle controller for cars"; Principle II requires
Rapier to be the source of truth for vehicle motion). It simulates wheel
suspension, ground raycasts, and friction without requiring us to hand-roll
vehicle physics — directly satisfying FR-003 (physics-driven steering) and
FR-009 equivalent from the constitution (no scripted/manual transform
changes).

**Drift and turbo as controller-level tuning, not new physics systems**:
- **Drift** (FR-004) is implemented by temporarily reducing the per-wheel
  side-friction/traction value the controller applies while the drift input
  is held, then restoring the normal value on release. This stays entirely
  within the vehicle controller's own tuning surface — no custom slip
  physics needed.
- **Turbo** (FR-005/FR-006) is implemented by temporarily increasing the
  engine force applied to the wheels for the boost duration, then enforcing
  a cooldown in application logic before it can be reapplied. This is
  ordinary input-driven force scaling, not a new physics feature.

Both approaches keep 100% of vehicle motion attributable to the Rapier
simulation (Principle II), with only *inputs to* the controller changing —
never bypassing it to move the chassis directly.

**Alternatives considered**: Hand-rolled kinematic vehicle movement (manual
position/rotation updates driven by a simplified formula) — rejected outright,
this is explicitly disallowed by Principle II and Principle IX/Technology
Constraints ("MUST use Rapier's raycast vehicle controller rather than a
custom hand-rolled controller").

## 3. Grey-box visuals: primitives vs. `.glb`/`.gltf` assets

**Decision**: Build the grey-box vehicle and arena from Three.js primitive
geometries (`BoxGeometry`, `PlaneGeometry`, etc.) rather than authoring or
loading `.glb`/`.gltf` files for this slice.

**Rationale**: The constitution locks `.glb`/`.gltf` as the format *when
models are used* (Technology Constraints), but does not mandate that every
visual element must be an external asset — "grey-box, art-agnostic" (Visual
Approach) is naturally satisfied by primitive geometry, and it avoids
producing throwaway placeholder art files. `GLTFLoader` integration is
deferred until a feature actually needs authored models, consistent with
Simplicity & YAGNI (Principle IV: no dependency/effort ahead of real need).
No violation of the locked asset-format rule occurs, since no non-`.glb`
model format is introduced — we simply don't load an external model yet.

**Alternatives considered**: Author placeholder `.glb` boxes now — rejected,
adds an asset-authoring/export step with no gameplay or architectural
benefit over a primitive `BoxGeometry` at this stage.

## 4. Third-person follow camera

**Decision**: A manually-coded damped follow camera: each frame, compute a
target position offset from the vehicle chassis (behind and above, in the
vehicle's local space) and `lerp` the actual Three.js camera position/lookAt
toward that target over time, rather than rigidly parenting the camera to
the chassis.

**Rationale**: Rigid parenting would make the camera inherit every physics
jitter and rotation snap from the vehicle instantly, which reads as harsh
and disorienting; damped following is the standard technique for
third-person vehicle cameras and needs no additional dependency (a `lerp`
is a few lines of vector math against Three.js's own `Vector3`).

**Alternatives considered**: Three.js `OrbitControls` — rejected, it's
designed for user-driven orbiting around a static target, not for
programmatically following a moving physics body; would need to be fought
against rather than used as intended.

## 5. Testing approach

**Decision**: Two tiers —
1. **Unit tests** (Vitest) for pure, non-physics logic only: input mapping
   (keyboard state → normalized action axes) and the turbo cooldown
   state machine (available → active → cooling down → available).
2. **Manual playtest validation** (documented as repeatable steps in
   `quickstart.md`) for anything involving physics feel: drive/steer
   responsiveness, drift traction change, turbo speed increase, boundary
   collision, and the 60 FPS target — these are inherently about *feel* and
   frame-rate, which automated unit tests cannot meaningfully assert.

**Rationale**: Vitest ships from the same team as Vite and requires no
extra bundler/config wiring beyond adding it as a dev dependency, so it
fits within "Vite tooling" without introducing an unrelated test framework
(Principle IV). Physics-feel and frame-rate concerns are not the kind of
thing a unit test can meaningfully assert without turning into a brittle
snapshot of simulation values, so they're validated by hand per the
constitution's existing reliance on playtesting for tuning (see
`Assumptions` in both specs) rather than invented into a false sense of
automated coverage.

**Alternatives considered**: Full physics-in-the-loop integration tests
(spin up Rapier headless, assert exact position/velocity trajectories) —
rejected as overly brittle for this stage (small changes to tuning
constants would break exact-position assertions) and not justified by a
concrete current need; revisit if regressions in physics behavior become a
recurring problem.

## 6. Performance measurement (60 FPS target)

**Decision**: Measure via the browser's built-in DevTools Performance/FPS
meter during manual playtest, documented as a `quickstart.md` step. No FPS
counter library (e.g., stats.js) is added to the shipped code.

**Rationale**: Adding a runtime dependency solely to display FPS during
development is unnecessary — browsers already expose this, and Principle IV
requires justifying new dependencies against concrete need. If a persistent
in-game FPS readout becomes a real product requirement later, it can be
added as a small first-party utility without a new dependency.

**Alternatives considered**: `stats.js` — rejected as an unjustified new
dependency for a need already met by browser DevTools.
