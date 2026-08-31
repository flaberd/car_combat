import { describe, expect, it } from "vitest";
import { findBestTarget } from "../../src/combat/targeting.js";

function fakeVehicle(x, z, { eliminated = false } = {}) {
  return {
    eliminated,
    chassisBody: { translation: () => ({ x, y: 1, z }) },
  };
}

describe("findBestTarget", () => {
  it("returns null with no candidates", () => {
    expect(
      findBestTarget({ x: 0, z: 0 }, { x: 0, z: 1 }, [], { radius: 50, coneDegrees: 360 }),
    ).toBe(null);
  });

  it("finds a single candidate within radius", () => {
    const target = fakeVehicle(10, 0);
    const result = findBestTarget({ x: 0, z: 0 }, { x: 0, z: 1 }, [target], {
      radius: 50,
      coneDegrees: 360,
    });
    expect(result).toBe(target);
  });

  it("excludes candidates outside the radius", () => {
    const tooFar = fakeVehicle(100, 0);
    const result = findBestTarget({ x: 0, z: 0 }, { x: 0, z: 1 }, [tooFar], {
      radius: 50,
      coneDegrees: 360,
    });
    expect(result).toBe(null);
  });

  it("picks the nearest of several candidates within range", () => {
    const near = fakeVehicle(5, 0);
    const far = fakeVehicle(20, 0);
    const result = findBestTarget({ x: 0, z: 0 }, { x: 0, z: 1 }, [far, near], {
      radius: 50,
      coneDegrees: 360,
    });
    expect(result).toBe(near);
  });

  it("excludes eliminated candidates", () => {
    const dead = fakeVehicle(5, 0, { eliminated: true });
    const alive = fakeVehicle(20, 0);
    const result = findBestTarget({ x: 0, z: 0 }, { x: 0, z: 1 }, [dead, alive], {
      radius: 50,
      coneDegrees: 360,
    });
    expect(result).toBe(alive);
  });

  it("with coneDegrees: 360, finds a target behind the origin's facing", () => {
    // Origin faces +z; candidate is directly behind at -z.
    const behind = fakeVehicle(0, -10);
    const result = findBestTarget({ x: 0, z: 0 }, { x: 0, z: 1 }, [behind], {
      radius: 50,
      coneDegrees: 360,
    });
    expect(result).toBe(behind);
  });

  it("with a narrow cone, excludes a target outside it", () => {
    // Origin faces +z; candidate is directly behind (180 deg away) — well
    // outside a 60-degree forward cone.
    const behind = fakeVehicle(0, -10);
    const result = findBestTarget({ x: 0, z: 0 }, { x: 0, z: 1 }, [behind], {
      radius: 50,
      coneDegrees: 60,
    });
    expect(result).toBe(null);
  });

  it("with a narrow cone, includes a target inside it", () => {
    // Origin faces +z; candidate is slightly off-axis but within 60 deg.
    const inFront = fakeVehicle(2, 10);
    const result = findBestTarget({ x: 0, z: 0 }, { x: 0, z: 1 }, [inFront], {
      radius: 50,
      coneDegrees: 60,
    });
    expect(result).toBe(inFront);
  });
});
