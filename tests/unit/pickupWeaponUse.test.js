import { describe, expect, it } from "vitest";
import { switchWeapon } from "../../src/combat/pickupWeaponUse.js";

function fakeVehicle(weaponSlots, selectedWeaponIndex = 0) {
  return { weaponSlots, selectedWeaponIndex };
}

function slot(type, ammo = 3) {
  return { type, ammo, lockState: null };
}

describe("switchWeapon", () => {
  it("is a no-op with an empty inventory", () => {
    const vehicle = fakeVehicle([]);
    switchWeapon(vehicle, 1);
    expect(vehicle.selectedWeaponIndex).toBe(0);
  });

  it("advances to the next slot and wraps around", () => {
    const vehicle = fakeVehicle([slot("rockets"), slot("mines"), slot("oilSlick")], 0);

    switchWeapon(vehicle, 1);
    expect(vehicle.selectedWeaponIndex).toBe(1);

    switchWeapon(vehicle, 1);
    expect(vehicle.selectedWeaponIndex).toBe(2);

    switchWeapon(vehicle, 1); // wraps back to the first slot
    expect(vehicle.selectedWeaponIndex).toBe(0);
  });

  it("goes to the previous slot and wraps around backwards", () => {
    const vehicle = fakeVehicle([slot("rockets"), slot("mines"), slot("oilSlick")], 0);

    switchWeapon(vehicle, -1);
    expect(vehicle.selectedWeaponIndex).toBe(2); // wraps to the last slot

    switchWeapon(vehicle, -1);
    expect(vehicle.selectedWeaponIndex).toBe(1);
  });

  it("cancels an in-progress homing-rocket lock on the slot switched away from", () => {
    const homingSlot = slot("homingRockets");
    homingSlot.lockState = { progress: 0.5, targetVehicle: {} };
    const vehicle = fakeVehicle([homingSlot, slot("mines")], 0);

    switchWeapon(vehicle, 1);

    expect(homingSlot.lockState).toBe(null);
    expect(vehicle.selectedWeaponIndex).toBe(1);
  });
});
