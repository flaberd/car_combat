import { describe, expect, it, vi } from "vitest";
import {
  tryFireMachineGun,
  updateMachineGunCooldown,
} from "../../src/combat/machineGun.js";
import { WEAPONS } from "../../src/config/tuning.js";

function makeFakeVehicle(overrides = {}) {
  return {
    eliminated: false,
    machineGunCooldownRemaining: 0,
    chassisBody: {
      translation: () => ({ x: 0, y: 0, z: 0 }),
    },
    mesh: { quaternion: { x: 0, y: 0, z: 0, w: 1 } },
    ...overrides,
  };
}

function makeFakeWorld(hitResult = null) {
  return { castRay: vi.fn(() => hitResult) };
}

describe("updateMachineGunCooldown", () => {
  it("counts down toward zero and clamps at zero", () => {
    const vehicle = makeFakeVehicle({ machineGunCooldownRemaining: 0.05 });
    updateMachineGunCooldown(vehicle, 0.1);
    expect(vehicle.machineGunCooldownRemaining).toBe(0);
  });

  it("decrements by dt while above zero", () => {
    const vehicle = makeFakeVehicle({ machineGunCooldownRemaining: 0.5 });
    updateMachineGunCooldown(vehicle, 0.1);
    expect(vehicle.machineGunCooldownRemaining).toBeCloseTo(0.4);
  });
});

describe("tryFireMachineGun", () => {
  it("does nothing when not firing", () => {
    const world = makeFakeWorld();
    const vehicle = makeFakeVehicle();
    tryFireMachineGun(world, vehicle, false);
    expect(world.castRay).not.toHaveBeenCalled();
  });

  it("does nothing while eliminated", () => {
    const world = makeFakeWorld();
    const vehicle = makeFakeVehicle({ eliminated: true });
    tryFireMachineGun(world, vehicle, true);
    expect(world.castRay).not.toHaveBeenCalled();
  });

  it("does nothing while on cooldown", () => {
    const world = makeFakeWorld();
    const vehicle = makeFakeVehicle({ machineGunCooldownRemaining: 0.1 });
    tryFireMachineGun(world, vehicle, true);
    expect(world.castRay).not.toHaveBeenCalled();
  });

  it("fires and sets cooldown to 1/fireRate when available", () => {
    const world = makeFakeWorld(null); // no hit
    const vehicle = makeFakeVehicle();
    tryFireMachineGun(world, vehicle, true);
    expect(world.castRay).toHaveBeenCalledOnce();
    expect(vehicle.machineGunCooldownRemaining).toBeCloseTo(
      1 / WEAPONS.machineGun.fireRate,
    );
  });
});
