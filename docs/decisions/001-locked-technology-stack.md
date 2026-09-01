# Locked Technology Stack

## Context

The project needs a stack decision that removes an entire class of
"which tool should we use" questions from every future feature, keeps the
codebase consistent across contributors (human or AI), and matches the
project's actual constraints (static hosting on GitHub Pages, no server to
run business logic).

---

## Decision

The stack is locked for the initial development phase:

- **Rendering**: Three.js (WebGL)
- **Physics**: Rapier, using its raycast vehicle controller for cars
- **Build**: Vite
- **Language**: Plain JavaScript (ES modules) — TypeScript is explicitly out
  of scope at project start
- **Hosting**: GitHub Pages (static hosting only)
- **3D Assets**: `.glb`/`.gltf`, loaded via `GLTFLoader` — other 3D formats
  (`.fbx`, `.obj`, etc.) MUST be converted before being committed

Any change proposing a different rendering engine, physics engine, build
tool, or hosting model MUST be rejected unless this decision is amended
first. Introducing TypeScript, a backend service, or a database is a stack
change and requires the same amendment process.

---

## Consequences

- All vehicle physics bodies MUST use Rapier's raycast vehicle controller
  rather than a custom hand-rolled controller, unless a documented Rapier
  limitation makes this impossible.
- Build and dev tooling goes through Vite; no parallel/competing bundler.
- No server-side code path can exist for game logic (see
  [Static-Site, No-Backend Architecture](003-static-site-no-backend.md)).

---

## Alternatives Considered

Not recorded at time of writing — this decision was made at project start.
A framework (React/Vue) and a compiled language (TypeScript) were considered
implicitly out of scope per
[Simplicity & YAGNI](004-simplicity-and-yagni.md).

---

## Amendment Process

Requires an explicit decision amendment: documented rationale, and
propagation of the change to this document in the same change.

---

## Related Documents

- [Static-Site, No-Backend Architecture](003-static-site-no-backend.md)
- [Simplicity & YAGNI](004-simplicity-and-yagni.md)
- [Module Overview](../architecture/module-overview.md)
