Hooks.once("init", () => {
  // Module initialized
});

Hooks.once("ready", () => {
  const DamageRoll = CONFIG.Dice?.DamageRoll;
  if (!DamageRoll) {
    console.warn("SWADE Brutal Damage | Could not find DamageRoll.");
    return;
  }

  const originalEvaluate = DamageRoll.prototype.evaluate;

  DamageRoll.prototype.evaluate = async function (...args) {

    /*
     * First, determine whether this is a Brutal damage roll.
     *
     * The swadeRollDamage hook adds "rr1" to the dice belonging
     * to a Brutal weapon/actor. We use that modifier as the marker
     * that tells us this roll needs the special Brutal/explosion
     * interaction.
     */
    let hasBrutalDie = false;

    for (const term of this.terms) {
      if (!(term instanceof foundry.dice.terms.Die)) continue;

      if (
        term.modifiers.includes("rr1") ||
        term.modifiers.includes("r1")
      ) {
        hasBrutalDie = true;
        break;
      }
    }

    /*
     * If this is a Brutal roll, make sure every damage die has
     * the recursive reroll of 1.
     *
     * This includes:
     * - Weapon damage
     * - Strength damage
     * - Raise / bonus damage
     */
    if (hasBrutalDie) {
      for (const term of this.terms) {
        if (!(term instanceof foundry.dice.terms.Die)) continue;

        term.modifiers = term.modifiers.filter(
          m => m !== "rr1" && m !== "r1"
        );

        term.modifiers.push("rr1");
      }

      this.resetFormula();
    }

    /*
     * Let SWADE / Foundry perform the normal damage roll first.
     *
     * This preserves all of the normal SWADE damage behavior,
     * including exploding maximum damage dice.
     */
    const result = await originalEvaluate.apply(this, args);

    /*
     * Brutal's special interaction:
     *
     * Foundry processes "rr1" and "x" separately. This means:
     *
     *     1 -> 6
     *
     * will reroll the 1 into a 6, but that newly-created 6 will
     * not normally be seen by the earlier "x" modifier.
     *
     * We repeatedly check the results after the normal roll and
     * resolve any newly-created interactions.
     */
    if (hasBrutalDie) {

      for (const term of this.terms) {
        if (!(term instanceof foundry.dice.terms.Die)) continue;

        /*
         * Keep resolving the die until a complete pass produces
         * no new rerolls or explosions.
         */
        let safetyCounter = 0;
        const MAX_ITERATIONS = 1000;

        while (safetyCounter < MAX_ITERATIONS) {
          safetyCounter++;

          let changed = false;

          /*
           * STEP 1:
           *
           * Find any active 1 that has not already been rerolled.
           *
           * This catches 1s produced by an explosion.
           */
          const hasNewOne = term.results.some(result => {
            return (
              result.active !== false &&
              result.result === 1 &&
              !result.rerolled
            );
          });

          if (hasNewOne) {
            await term.rerollRecursive("rr1");
            changed = true;
          }

          /*
           * STEP 2:
           *
           * Find any active maximum result that has not already
           * exploded.
           *
           * This catches maximum results produced by Brutal
           * rerolls.
           *
           * "true" tells Foundry that the explosion itself should
           * continue recursively.
           */
          const hasNewMaximum = term.results.some(result => {
            return (
              result.active !== false &&
              result.result === term.faces &&
              !result.exploded
            );
          });

          if (hasNewMaximum) {
            await term.explode("x", true);
            changed = true;
          }

          /*
           * If neither operation changed anything, this die is
           * completely resolved.
           */
          if (!changed) break;
        }

        /*
         * If something has gone badly wrong and the safety limit
         * was reached, report it instead of allowing the browser
         * to get stuck in an infinite loop.
         */
        if (safetyCounter >= MAX_ITERATIONS) {
          console.error(
            "SWADE Brutal Damage | Safety limit reached while resolving a Brutal die.",
            term
          );
        }
      }
    }

    return result;
  };
});


/*
 * Detect whether the actor or weapon has the Brutal flag and add
 * rr1 to the damage dice before the roll is evaluated.
 */
Hooks.on("swadeRollDamage", (actor, item, roll, modifiers, options) => {

  const hasBrutal =
    actor?.getFlag("swade-brutal-damage", "brutal") ||
    item?.getFlag("swade-brutal-damage", "brutal");

  if (!hasBrutal || !roll?.terms) return;

  /*
   * Add Brutal to every damage die.
   *
   * This includes the weapon die, Strength die, and Raise /
   * bonus damage die.
   */
  for (const term of roll.terms) {
    if (!(term instanceof foundry.dice.terms.Die)) continue;

    term.modifiers = term.modifiers.filter(
      m => m !== "rr1" && m !== "r1"
    );

    term.modifiers.push("rr1");
  }
});
