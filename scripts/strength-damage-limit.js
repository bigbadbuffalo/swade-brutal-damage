const SWP_MODULE_ID = "swade-weapon-properties";
const SWP_STRENGTH_DAMAGE_SETTING = "enforceStrengthDamageLimit";

/*
 * Enforce SWADE's Strength-based weapon damage limit.
 *
 * RAW:
 * A melee or thrown weapon's damage die cannot exceed the
 * wielder's Strength die.
 *
 * Examples:
 *
 *   Strength d4 + Str+d8 weapon
 *   becomes
 *   d4 + d4
 *
 *   Strength d6 + Str+d10+2 weapon
 *   becomes
 *   d6 + d6 + 2
 *
 * This script deliberately automates ONLY the damage-die limit.
 * It does not enforce any of the other Minimum Strength rules.
 */
Hooks.on(
  "swadeRollDamage",
  (actor, item, roll, modifiers, options) => {
    /*
     * Do nothing unless the GM has enabled this rule.
     */
    if (
      !game.settings.get(
        SWP_MODULE_ID,
        SWP_STRENGTH_DAMAGE_SETTING
      )
    ) {
      return;
    }

    /*
     * We need an Actor, Item, and DamageRoll to apply the rule.
     */
    if (!actor || !item || !roll) {
      return;
    }

    /*
     * Determine the damage formula SWADE actually used.
     *
     * dmgOverride takes precedence because SWADE itself uses it
     * instead of the weapon's normal damage when one is supplied.
     */
    const damageFormula = String(
      options?.dmgOverride ??
      item.system?.damage ??
      ""
    );

    /*
     * Only Strength-based damage is relevant.
     *
     * Normal fixed-damage weapons such as 2d6 firearms are left
     * completely untouched.
     */
    if (!/@(?:str|strength)\b/i.test(damageFormula)) {
      return;
    }

    /*
     * Get the wielder's ACTUAL Strength die.
     *
     * We intentionally use the actual Strength attribute rather than
     * Minimum Strength adjustments such as Soldier or Brawny.
     *
     * Those abilities help satisfy Minimum Strength requirements but
     * do not actually increase the character's Strength die.
     */
    const strengthSides = Number(
      actor.system?.attributes?.strength?.die?.sides
    );

    if (
      !Number.isFinite(strengthSides) ||
      strengthSides < 1
    ) {
      return;
    }

    /*
     * SWADE labels the weapon's normal damage die as Base Damage.
     *
     * This is important because the roll also contains the character's
     * Strength die. We want to cap the WEAPON die, not Strength itself.
     *
     * We modify only the first Base Damage DiceTerm. This preserves
     * additional intrinsic damage dice such as:
     *
     *   Str+d8+d6
     *
     * where the d8 is the weapon's base damage die and the additional
     * d6 is bonus damage from some other property.
     */
    const Die = foundry.dice.terms.Die;
    const baseDamageLabel =
      game.i18n.localize("SWADE.BaseDamage");

    const weaponDamageDie = roll.dice.find(
      term =>
        term instanceof Die &&
        term.flavor === baseDamageLabel
    );

    /*
     * A Strength-only formula such as @str has no separate weapon
     * damage die, so there is nothing to limit.
     */
    if (!weaponDamageDie) {
      return;
    }

    const weaponFaces = Number(
      weaponDamageDie.faces
    );

    if (
      !Number.isFinite(weaponFaces) ||
      weaponFaces <= strengthSides
    ) {
      return;
    }

    /*
     * Cap the weapon damage die at Strength.
     *
     * Foundry v14 exposes DiceTerm.faces as a writable property, so
     * we can change the die without reconstructing the entire roll.
     */
    weaponDamageDie.faces = strengthSides;

    /*
     * Rebuild the displayed/stored formula to reflect the changed die.
     *
     * Raises, Conviction, Brutal, and other later modifiers will then
     * operate on the corrected base roll.
     */
    roll.resetFormula();
  }
);
