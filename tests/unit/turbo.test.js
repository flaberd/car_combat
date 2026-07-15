import { describe, expect, it } from "vitest";
import { createTurboState, updateTurboState } from "../../src/vehicle/turbo.js";

const DURATIONS = { turboBoostDuration: 1.75, turboCooldown: 6 };

describe("TurboState", () => {
  it("starts ready", () => {
    expect(createTurboState().status).toBe("ready");
  });

  it("transitions ready -> boosting when pressed", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1, DURATIONS);
    expect(turbo.status).toBe("boosting");
  });

  it("ignores press while not ready (no reactivation mid-boost)", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1, DURATIONS); // -> boosting
    updateTurboState(turbo, true, 0.1, DURATIONS); // still boosting, press ignored
    expect(turbo.status).toBe("boosting");
  });

  it("transitions boosting -> cooling_down once boost duration elapses", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1, DURATIONS); // -> boosting
    updateTurboState(turbo, false, DURATIONS.turboBoostDuration, DURATIONS);
    expect(turbo.status).toBe("cooling_down");
  });

  it("stays cooling_down even if turbo is pressed again", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1, DURATIONS); // -> boosting
    updateTurboState(turbo, false, DURATIONS.turboBoostDuration, DURATIONS); // -> cooling_down
    updateTurboState(turbo, true, 0.1, DURATIONS); // press ignored, still cooling down
    expect(turbo.status).toBe("cooling_down");
  });

  it("transitions cooling_down -> ready once cooldown elapses", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1, DURATIONS); // -> boosting
    updateTurboState(turbo, false, DURATIONS.turboBoostDuration, DURATIONS); // -> cooling_down
    updateTurboState(turbo, false, DURATIONS.turboCooldown, DURATIONS); // -> ready
    expect(turbo.status).toBe("ready");
  });

  it("can be reactivated once back to ready", () => {
    const turbo = createTurboState();
    updateTurboState(turbo, true, 0.1, DURATIONS);
    updateTurboState(turbo, false, DURATIONS.turboBoostDuration, DURATIONS);
    updateTurboState(turbo, false, DURATIONS.turboCooldown, DURATIONS);
    updateTurboState(turbo, true, 0.1, DURATIONS);
    expect(turbo.status).toBe("boosting");
  });
});
