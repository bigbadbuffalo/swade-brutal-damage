import {
  SWP_MODULE_ID,
  getMinimumStrengthShortfall
} from "./helpers/minimum-strength.js";

const SWP_SETTING =
  "enforceMeleeThrownMinStrRestrictions";

/*
 * SWADE v6.0.4 weapon equip states:
 * 0 = Stored
 * 1 = Carried
 * 2 = Off Hand
 * 3 = Equipped
 * 4 = Main Hand
 * 5 = Two Hands
 *
 * Minimum Strength restrictions only matter for a weapon the character
 * is actually wielding/using. Stored and merely Carried weapons should
 * retain their displayed weapon statistics.
 */
const READIED_WEAPON_STATES =
  new Set([2, 3, 4, 5]);

function shouldRestrictWeapon(actor, item) {
  const equipStatus =
    Number(item?.system?.equipStatus ?? 0);

  return Boolean(
    actor &&
    item?.type === "weapon" &&
    item.system?.isMelee &&
    READIED_WEAPON_STATES.has(equipStatus) &&
    getMinimumStrengthShortfall(actor, item) > 0
  );
}

/*
 * RAW Minimum Strength restriction for melee/thrown weapons:
 * if the wielder is below Minimum Strength, positive weapon abilities
 * are lost.
 *
 * SWADE calculates derived Parry later in actor preparation and reads
 * weapon AP later when damage is built. Suppress the structured weapon
 * values here, before those downstream calculations occur, rather than
 * trying to patch the already-calculated results afterward.
 *
 * These assignments affect only the prepared/derived item data for the
 * current preparation cycle. They do not update the embedded Item's
 * stored source data, so meeting Minimum Strength again or unreadying
 * the weapon restores the weapon's normal values on the next
 * preparation cycle.
 *
 * We deliberately automate only structured, unambiguously positive
 * weapon benefits that SWADE exposes directly:
 *
 * - positive weapon Parry -> 0
 * - positive weapon AP -> 0
 *
 * Reach, free-form Notes, and module-owned properties such as Brutal or
 * Off Hand remain manual rather than coupling this rule to semantic or
 * property-specific interception.
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

    for (const item of actor.items ?? []) {
      if (!shouldRestrictWeapon(actor, item)) {
        continue;
      }

      const weaponParry =
        Number(item.system?.parry ?? 0);

      if (
        Number.isFinite(weaponParry) &&
        weaponParry > 0
      ) {
        item.system.parry = 0;
      }

      const weaponAp =
        Number(item.system?.ap ?? 0);

      if (
        Number.isFinite(weaponAp) &&
        weaponAp > 0
      ) {
        item.system.ap = 0;
      }
    }
  }
);
