const PORTRAIT_QUERY = "(orientation: portrait)";

/**
 * Pure: gameplay is blocked iff in touch mode AND the device is currently
 * portrait (data-model.md OrientationGate invariant; FR-007/FR-010) — never
 * blocks in keyboard mode, regardless of window aspect ratio.
 */
export function computeBlocked(mode, isPortrait) {
  return mode === "touch" && isPortrait;
}

/** Tracks live device orientation via matchMedia (research.md §4). */
export function createOrientationGate(window, { onChange } = {}) {
  const mediaQuery = window.matchMedia(PORTRAIT_QUERY);
  let isPortrait = mediaQuery.matches;

  const onMediaChange = (event) => {
    isPortrait = event.matches;
    onChange?.();
  };
  mediaQuery.addEventListener("change", onMediaChange);

  return {
    get isPortrait() {
      return isPortrait;
    },
    dispose() {
      mediaQuery.removeEventListener("change", onMediaChange);
    },
  };
}
