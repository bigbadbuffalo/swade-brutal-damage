Hooks.once("ready", () => {
  const DamageRoll = CONFIG.Dice?.DamageRoll;

  if (!DamageRoll) {
    console.warn("SWADE Brutal Damage | Could not find DamageRoll.");
    return;
  }

  const Die = foundry.dice.terms.Die;
  const originalEvaluate = DamageRoll.prototype.evaluate;

  /**
   * Resolve one Brutal die from beginning to end.
   *
   * Brutal works like this:
   *   1 = discard it and roll again
   *   maximum = keep it and roll an additional die
   *
   * Every new result is checked again, so chains such as
   * 1 -> 4 -> 1 -> 4 -> 3 work correctly.
   */
  async function resolveBrutalDie(term) {
    let index = 0;
    let safetyCounter = 0;
    const MAX_RESULTS = 1000;

    while (index < term.results.length) {
      safetyCounter++;

      if (safetyCounter > MAX_RESULTS) {
        console.error(
          "SWADE Brutal Damage | Safety limit reached while resolving a die.",
          term
        );
        break;
      }

      const result = term.results[index];

      // Results made inactive by another modifier do not need processing.
      if (!result || result.active === false) {
        index++;
        continue;
      }

      // Brutal: a 1 contributes nothing and is rerolled.
      if (result.result === 1) {
        result.active = false;
        result.rerolled = true;

        await term.roll();

        // The newly rolled result was appended to the end.
        index = term.results.length - 1;
        continue;
      }

      // SWADE: a maximum result contributes its value and explodes.
      if (result.result === term.faces) {
        result.exploded = true;

        await term.roll();

        // Process the newly rolled result immediately.
        index = term.results.length - 1;
        continue;
      }

      // This result is neither a 1 nor a maximum, so this chain ends.
      index++;
    }
  }

  DamageRoll.prototype.evaluate = async function (...args) {
    /*
     * A Brutal roll is identified by the rr1 marker added by the
     * swadeRollDamage hook below.
     */
    const brutalDice = this.terms.filter(
      term =>
        term instanceof Die &&
        term.modifiers.includes("rr1")
    );

    if (brutalDice.length === 0) {
      return originalEvaluate.apply(this, args);
    }

    /*
     * Replace Foundry's normal modifier evaluation for each Brutal die.
     *
     * We temporarily remove "rr1" and "x" so Foundry does not process
     * them separately. We then perform both rules together in
     * resolveBrutalDie().
     */
    for (const term of brutalDice) {
      const originalEvaluateModifiers = term._evaluateModifiers;

      term._evaluateModifiers = async function () {
        const originalModifiers = this.modifiers;

        // Let all non-Brutal modifiers work normally.
        this.modifiers = originalModifiers.filter(
          modifier => modifier !== "rr1" && modifier !== "r1" && modifier !== "x"
        );

        await originalEvaluateModifiers.call(this);

        // Restore the original formula modifiers so the chat card still
        // displays the normal SWADE formula (for example, 1d4xrr1).
        this.modifiers = originalModifiers;

        // Now resolve Brutal + SWADE exploding behavior as one process.
        await resolveBrutalDie(this);
      };
    }

    return originalEvaluate.apply(this, args);
  };
});


/*
 * Detect the Brutal Active Effect on the actor or item and mark every
 * damage die with rr1.
 *
 * rr1 is used here as a marker telling the evaluate patch that this
 * is a Brutal damage roll. The actual reroll is handled by the custom
 * resolver above.
 */
Hooks.on("swadeRollDamage", (actor, item, roll, modifiers, options) => {
  const hasBrutal =
    actor?.getFlag("swade-brutal-damage", "brutal") ||
    item?.getFlag("swade-brutal-damage", "brutal");

  if (!hasBrutal || !roll?.terms) return;

  for (const term of roll.terms) {
    if (!(term instanceof foundry.dice.terms.Die)) continue;

    term.modifiers = term.modifiers.filter(
      modifier => modifier !== "rr1" && modifier !== "r1"
    );

    term.modifiers.push("rr1");
  }
});
