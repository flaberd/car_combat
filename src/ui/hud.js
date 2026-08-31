import { WEAPONS } from "../config/tuning.js";

const WEAPON_LABELS = {
  rockets: "Rockets",
  homingRockets: "Homing Rockets",
  mines: "Mines",
  oilSlick: "Oil Slick",
};

const LOW_HP_RATIO = 0.5;
const CRITICAL_HP_RATIO = 0.25;

/**
 * Player HUD: HP bar/text, the currently selected pickup weapon's name +
 * remaining ammo, and — for homing rockets specifically — a hint that it
 * needs a held press plus a lock-progress bar while charging. Unlike every
 * other weapon (which fires on a quick tap), homing rockets requires
 * holding Use for `lockOnTime`; without this hint a player tapping it the
 * same way as the others would see it silently never fire. The machine
 * gun isn't shown here — it has unlimited ammo and needs no pickup.
 */
export function createHud(document) {
  const rootEl = document.getElementById("hud");
  const hpFillEl = document.getElementById("hud-hp-fill");
  const hpTextEl = document.getElementById("hud-hp-text");
  const weaponTextEl = document.getElementById("hud-weapon-text");
  const lockTrackEl = document.getElementById("hud-lock-track");
  const lockFillEl = document.getElementById("hud-lock-fill");

  function show() {
    rootEl.classList.remove("hidden");
  }

  function update(vehicle) {
    const maxHp = vehicle.archetype.maxHp;
    const hp = Math.max(0, vehicle.hp);
    const hpRatio = maxHp > 0 ? hp / maxHp : 0;

    hpFillEl.style.width = `${hpRatio * 100}%`;
    hpFillEl.classList.toggle("critical", hpRatio <= CRITICAL_HP_RATIO);
    hpFillEl.classList.toggle(
      "low",
      hpRatio > CRITICAL_HP_RATIO && hpRatio <= LOW_HP_RATIO,
    );
    hpTextEl.textContent = `${Math.round(hp)} / ${maxHp}`;

    const slot = vehicle.weaponSlots[vehicle.selectedWeaponIndex];
    if (!slot) {
      weaponTextEl.textContent = "No weapon";
      lockTrackEl.classList.add("hidden");
      return;
    }

    const isHoming = slot.type === "homingRockets";
    weaponTextEl.textContent = isHoming
      ? `${WEAPON_LABELS[slot.type]}: ${slot.ammo} (hold Use to lock)`
      : `${WEAPON_LABELS[slot.type]}: ${slot.ammo}`;

    if (isHoming && slot.lockState) {
      const ratio = Math.min(
        1,
        slot.lockState.progress / WEAPONS.homingRockets.lockOnTime,
      );
      lockTrackEl.classList.remove("hidden");
      lockFillEl.style.width = `${ratio * 100}%`;
    } else {
      lockTrackEl.classList.add("hidden");
    }
  }

  return { show, update };
}
