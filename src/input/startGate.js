/**
 * StartGate (data-model.md StartGate; spec.md User Story 5, FR-012-FR-015;
 * research.md §7). One-way false -> true gate. On touch mode, `start()`
 * attempts fullscreen then a forced-landscape orientation lock — both are
 * best-effort: any rejection/exception is swallowed and never blocks the
 * transition to `started = true`. In keyboard mode neither API is called.
 */
export function createStartGate() {
  let started = false;

  async function start(mode) {
    if (started) return;
    started = true;

    if (mode !== "touch") return;

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen unsupported or denied — game still starts (FR-013).
      return;
    }

    try {
      await screen.orientation.lock("landscape");
    } catch {
      // Lock unsupported (e.g. iOS Safari) or rejected — the existing
      // matchMedia-based OrientationGate remains the fallback (FR-014).
    }
  }

  return {
    get started() {
      return started;
    },
    start,
  };
}
