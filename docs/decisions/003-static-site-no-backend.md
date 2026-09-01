# Static-Site, No-Backend Architecture

## Context

GitHub Pages hosting (see [Locked Technology Stack](001-locked-technology-stack.md))
is a fixed constraint. Designing for it from the start avoids costly rework
and keeps deployment to "push to the Pages branch."

---

## Decision

The game MUST run entirely client-side and MUST be deployable as static
files to GitHub Pages. Features MUST NOT require:

- A server-side process (API server, game server, database)
- Build-time or runtime dependencies unavailable in a static-hosting context
- User accounts, authentication, or server-persisted state

Persistence (e.g., settings, high scores), when needed, MUST use
browser-local mechanisms (e.g., `localStorage`).

---

## Consequences

- No feature may introduce a backend service or database.
- Deployment is `git push` to the branch GitHub Pages serves from (see
  `.github/workflows/deploy.yml`); there is no separate release pipeline
  beyond Vite's static build output.
- As of this writing, no feature has needed persistence yet — all game
  state (`InputState`, vehicle HP, etc.) lives in memory for the session.

---

## Alternatives Considered

A lightweight backend (for matchmaking, leaderboards, or save data) was
considered implicitly out of scope — it is explicitly listed as a non-goal
under [MVP Scope Discipline](007-mvp-scope-discipline.md).

---

## Related Documents

- [Locked Technology Stack](001-locked-technology-stack.md)
- [MVP Scope Discipline](007-mvp-scope-discipline.md)
