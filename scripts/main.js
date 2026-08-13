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
   *
   *   1 = discard it and roll again
   *   maximum = keep it and roll an additional die
   *
   * Every new result is immediately checked again.
   *
   * Examples:
   *
   *   1 -> 4 -> 3
   *   4 -> 1 -> 4 -> 3
   *   4 -> 4 -> 1 -> 4 -> 1 -> 3
   *
   * All of these are resolved correctly.
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

      // Ignore results that are inactive.
      if (!result || result.active === false) {
        index++;
        continue;
      }

      /*
       * BRUTAL:
       *
       * A result of 1 is discarded and the die is rolled again.
       */
      if (result.result === 1) {
        result.active = false;
        result.rerolled = true;

        await term.roll();

        // Process the newly-created result immediately.
        index = term.results.length - 1;
        continue;
      }

      /*
       * SWADE ACING / EXPLOSION:
       *
       * A maximum result is kept and the die is rolled again.
       */
      if (result.result === term.faces) {
        result.exploded = true;

        await term.roll();

        // Process the newly-created result immediately.
        index = term.results.length - 1;
        continue;
      }

      /*
       * Anything other than 1 or the maximum ends this die's
       * chain.
       */
      index++;
    }
  }


  DamageRoll.prototype.evaluate = async function (...args) {

    /*
     * Look for ANY die that has the rr1 marker.
     *
     * This marker tells us that this is a Brutal damage roll.
     *
     * We only need ONE Brutal die to establish that the entire
     * damage roll is Brutal.
     *
     * This is important because SWADE adds Raise / bonus damage
     * dice AFTER the swadeRollDamage hook runs.
     */
    const hasBrutal = this.terms.some(
      term =>
        term instanceof Die &&
        (
          term.modifiers.includes("rr1") ||
          term.modifiers.includes("r1")
        )
    );

    /*
     * This is an ordinary SWADE damage roll.
     * Let Foundry/SWADE handle it normally.
     */
    if (!hasBrutal) {
      return originalEvaluate.apply(this, args);
    }


    /*
     * IMPORTANT:
     *
     * At this point we are looking at the FINAL DamageRoll.
     *
     * That means this includes:
     *
     *   - Weapon damage
     *   - Strength damage
     *   - Raise / bonus damage
     *   - Other bonus damage dice
     *   - Conviction damage
     *   - Other dice added by modifiers
     *
     * Therefore every Die in this roll needs to receive Brutal.
     */
    const brutalDice = this.terms.filter(
      term => term instanceof Die
    );


    /*
     * Replace Foundry's normal modifier evaluation for EVERY
     * damage die in the Brutal roll.
     *
     * We temporarily remove:
     *
     *   rr1 = Brutal reroll
     *   r1  = normal reroll of 1
     *   x   = SWADE acing/explosion
     *
     * We then resolve both Brutal and SWADE acing together
     * ourselves.
     */
    for (const term of brutalDice) {

      /*
       * Make sure the die has the rr1 marker.
       *
       * This is what causes Raise / bonus dice to display
       * xrr1 in the formula as well.
       */
      term.modifiers = term.modifiers.filter(
        modifier =>
          modifier !== "rr1" &&
          modifier !== "r1"
      );

      term.modifiers.push("rr1");


      const originalEvaluateModifiers = term._evaluateModifiers;

      term._evaluateModifiers = async function () {

        const originalModifiers = this.modifiers;


        /*
         * Let Foundry process all modifiers EXCEPT the ones
         * that we are handling ourselves.
         */
        this.modifiers = originalModifiers.filter(
          modifier =>
            modifier !== "rr1" &&
            modifier !== "r1" &&
            modifier !== "x"
        );


        await originalEvaluateModifiers.call(this);


        /*
         * Restore the modifiers so the final chat card still
         * shows the proper SWADE formula.
         */
        this.modifiers = originalModifiers;


        /*
         * Now process Brutal and SWADE acing together.
         */
        await resolveBrutalDie(this);
      };
    }


    /*
     * Rebuild the formula so newly-added rr1 modifiers are
     * represented in the roll.
     */
    this.resetFormula();


    /*
     * Let Foundry evaluate the completed DamageRoll.
     */
    return originalEvaluate.apply(this, args);
  };
});


/*
 * Detect the Brutal Active Effect on the actor or item and mark
 * the base damage dice with rr1.
 *
 * The evaluate patch above will then extend Brutal to ALL dice
 * present in the final DamageRoll, including Raise / bonus dice.
 */
Hooks.on("swadeRollDamage", (actor, item, roll, modifiers, options) => {

  const hasBrutal =
    actor?.getFlag("swade-brutal-damage", "brutal") ||
    item?.getFlag("swade-brutal-damage", "brutal");


  if (!hasBrutal || !roll?.terms) return;


  /*
   * Mark the base damage dice as Brutal.
   *
   * The Raise / bonus dice don't exist yet at this point.
   * They will be picked up later by DamageRoll.evaluate().
   */
  for (const term of roll.terms) {

    if (!(term instanceof Die)) continue;

    term.modifiers = term.modifiers.filter(
      modifier =>
        modifier !== "rr1" &&
        modifier !== "r1"
    );

    term.modifiers.push("rr1");
  }
});
