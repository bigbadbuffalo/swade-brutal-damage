import {
  SWP_MODULE_ID,
  getMinimumStrengthShortfall
} from "./helpers/minimum-strength.js";

const SWP_SETTING =
  "enforceMeleeThrownMinStrRestrictions";

/*
 * SWADE v6.0.4 weapon equip states:
 * 4 = Main Hand
 * 5 = Two Hands
 *
 * Off-hand weapons do not contribute their normal weapon Parry bonus
 * to SWADE's calculated Parry, so only the states that can contribute
 * that bonus are relevant here.
 */
const PARRY_ACTIVE_EQUIP_STATES =
  new Set([4, 5]);

function shouldRestrictWeapon(actor, item) {
  return Boolean(
    actor &&
    item?.type === "weapon" &&
    item.system?.isMelee &&
    getMinimumStrengthShortfall(actor, item) > 0
  );
}

/*
 * RAW Minimum Strength restriction for melee/thrown weapons:
 * if the wielder is below Minimum Strength, positive weapon abilities
 * are lost. Foundry models weapon Parry as structured data, so remove
 * only the positive Parry contribution of an affected readied weapon.
 *
 * This deliberately does not attempt to infer semantic benefits from
 * free-form Notes or module-owned properties such as Brutal or Off Hand.
 */
Hooks.on(
  "swadeActorPrepareDerivedData",
  actor => {
    if (
      !game.settings.get(
        SWP_MODULE_ID,
        SWP_SETTING
      )
    ) {
      return;
    }

    const parry =
      actor?.system?.stats?.parry;

    if (!parry) {
      return;
    }

    let suppressedParry = 0;

    for (const item of actor.items ?? []) {
      if (!shouldRestrictWeapon(actor, item)) {
        continue;
      }

      const equipStatus =
        Number(item.system?.equipStatus ?? 0);

      if (
        !PARRY_ACTIVE_EQUIP_STATES.has(
          equipStatus
        )
      ) {
        continue;
      }

      const weaponParry =
        Number(item.system?.parry ?? 0);

      if (
        Number.isFinite(weaponParry) &&
        weaponParry > 0
      ) {
        suppressedParry += weaponParry;
      }
    }

    if (suppressedParry <= 0) {
      return;
    }

    const currentParry =
      Number(parry.value);

    if (!Number.isFinite(currentParry)) {
      return;
    }

    parry.value = Math.max(
      0,
      currentParry - suppressedParry
    );
  }
);

/*
 * Suppress positive weapon AP on damage rolls when a melee/thrown
 * weapon's Minimum Strength is not met.
 *
 * SWADE damage actions support AP as an override. Setting apOverride
 * here lets the normal damage workflow continue while replacing the
 * weapon/action AP with 0 for this roll. The additional roll-option
 * assignments keep the suppression visible to the current v6 damage
 * workflow without mutating the stored weapon item.
 */
Hooks.on(
  "swadeRollDamage",
  (actor, item, roll, modifiers, options) => {
    if (
      !game.settings.get(
        SWP_MODULE_ID,
        SWP_SETTING
      )
    ) {
      return;
    }

    if (!shouldRestrictWeapon(actor, item)) {
      return;
    }

    if (options) {
      options.apOverride = 0;
      options.ap = 0;
    }

    if (roll?.options) {
      roll.options.ap = 0;
      roll.options.armorPiercing = 0;
    }
  }
);
