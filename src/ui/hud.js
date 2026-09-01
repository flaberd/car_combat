const WEAPON_LABELS = {
  rockets: "Rockets",
  homingRockets: "Homing Rockets",
  mines: "Mines",
  oilSlick: "Oil Slick",
};

const LOW_HP_RATIO = 0.5;
const CRITICAL_HP_RATIO = 0.25;

/**
 * Player HUD: HP bar/text, turbo readiness bar/text, and the currently
 * selected pickup weapon's name + remaining ammo. For targeting-capable
 * weapons (currently just homing rockets — src/combat/targeting.js), also
 * shows whether a target is currently locked, since that's what determines
 * whether tapping Use will actually fire — the 3D marker over the target is
 * the primary feedback, this is a textual backup. The machine gun isn't
 * shown here — it has unlimited ammo and needs no pickup.
 *
 * Turbo (src/vehicle/turbo.js TurboState) has no on-screen feedback
 * otherwise, so a player holding it down repeatedly can't tell it's on a
 * cooldown rather than firing every press — the bar drains while boosting
 * and refills during cooldown, mirroring the HP bar's style.
 */
export function createHud(document) {
  const rootEl = document.getElementById("hud");
  const hpFillEl = document.getElementById("hud-hp-fill");
  const hpTextEl = document.getElementById("hud-hp-text");
  const turboFillEl = document.getElementById("hud-turbo-fill");
  const turboTextEl = document.getElementById("hud-turbo-text");
  const weaponTextEl = document.getElementById("hud-weapon-text");

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

    const { turbo, archetype } = vehicle;
    let turboRatio = 1;
    let turboText = "Turbo Ready";
    if (turbo.status === "boosting") {
      turboRatio = 1 - turbo.boostElapsed / archetype.turboBoostDuration;
      turboText = "Turbo Boosting";
    } else if (turbo.status === "cooling_down") {
      turboRatio = turbo.cooldownElapsed / archetype.turboCooldown;
      const remaining = archetype.turboCooldown - turbo.cooldownElapsed;
      turboText = `Turbo: ${Math.max(0, remaining).toFixed(1)}s`;
    }
    turboFillEl.style.width = `${Math.max(0, Math.min(1, turboRatio)) * 100}%`;
    turboFillEl.classList.toggle("boosting", turbo.status === "boosting");
    turboFillEl.classList.toggle("cooling", turbo.status === "cooling_down");
    turboTextEl.textContent = turboText;

    const slot = vehicle.weaponSlots[vehicle.selectedWeaponIndex];
    if (!slot) {
      weaponTextEl.textContent = "No weapon";
      return;
    }

    const targetHint =
      slot.type === "homingRockets"
        ? vehicle.activeTarget
          ? " (target locked)"
          : " (no target)"
        : "";
    weaponTextEl.textContent = `${WEAPON_LABELS[slot.type]}: ${slot.ammo}${targetHint}`;
  }

  return { show, update };
}
