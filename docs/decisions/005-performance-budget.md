# Performance Budget (60 FPS Target)

## Context

This is a real-time action game — frame rate directly determines whether
driving and combat feel responsive. A stated, testable budget prevents
performance regressions from accumulating silently.

---

## Decision

The game MUST target a sustained 60 FPS on the primary development hardware
for the core gameplay loop (vehicle physics + rendering + combat). Any
feature with a measurable, non-trivial performance cost (particle effects,
additional vehicles, complex geometry) MUST state its expected frame-time
impact before merge and MUST be validated against the budget.

---

## Consequences

- New systems that add per-frame work (extra vehicles, particle effects,
  complex geometry) need a stated frame-time impact, not just a
  "seems fine" check.

---

## Alternatives Considered

No formal budget (ad-hoc performance checks only) was rejected — the
project explicitly wants a testable target rather than relying on
"it felt fine when I tried it."

---

## Related Documents

- [Module Overview](../architecture/module-overview.md)
