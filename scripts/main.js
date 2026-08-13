Hooks.once("ready", () => {
  const DamageRoll = CONFIG.Dice?.DamageRoll;

  if (!DamageRoll) {
    console.warn("SWADE Brutal Damage | Could not find DamageRoll.");
    return;
  }

  const Die = foundry.dice.terms.Die;
  const originalEvaluate = DamageRoll.prototype.evaluate;

  /**
   * Resolve one Brutal die.
   *
   * Brutal:
   *   1 = discard the result and roll again
   *
   * SWADE Acing:
   *   Maximum = keep the result and roll again
   *
   * Every newly-generated result is checked again.
   */
  async function resolveBrutalDie(term) {
    let index = 0;
    let safetyCounter = 0;

    const MAX_RESULTS = 1000;

    while (index < term.results.length) {
      safetyCounter++;

      if (safetyCounter > MAX_RESULTS) {
        console.error(
          "SWADE Brutal Damage | Safety limit reached.",
          term
        );
        break;
      }

      const result = term.results[index];

      /*
       * Skip inactive results.
       *
       * A Brutal 1 becomes inactive when it is rerolled.
       */
      if (!result || result.active === false) {
        index++;
        continue;
      }

      /*
       * BRUTAL
       *
       * A 1 contributes nothing.
       * Mark it as rerolled and roll another result.
       */
      if (result.result === 1) {
        result.active = false;
        result.rerolled = true;

        await term.roll();

        /*
         * term.roll() appends the new result.
         * Process that result immediately.
         */
        index = term.results.length - 1;
        continue;
      }

      /*
       * SWADE ACING
       *
       * A maximum result contributes normally,
       * but generates another roll.
       */
      if (result.result === term.faces) {
        result.exploded = true;

        await term.roll();

        /*
         * Process the newly-generated result immediately.
         */
        index = term.results.length - 1;
        continue;
      }

      /*
       * Neither 1 nor maximum:
       * this particular chain is finished.
       */
      index++;
    }
  }


  DamageRoll.prototype.evaluate = async function (...args) {

    /*
     * FIRST:
     *
     * Determine whether this is a Brutal damage roll.
     *
     * The original damage dice were marked with rr1 by the
     * swadeRollDamage hook below.
     *
     * We deliberately use terms here because these are the
     * original SWADE damage terms which retain our marker.
     */
    const hasBrutal = this.terms.some(
      term =>
        term instanceof Die &&
        term.modifiers?.includes("rr1")
    );


    /*
     * No Brutal marker?
     *
     * Do absolutely nothing and allow SWADE to evaluate
     * the damage normally.
     */
    if (!hasBrutal) {
      return originalEvaluate.apply(this, args);
    }


    /*
     * IMPORTANT:
     *
     * We now know that the DAMAGE ROLL is Brutal.
     *
     * Do NOT restrict ourselves to the dice that already
     * contain rr1.
     *
     * SWADE adds things such as:
     *
     *   - Raise damage
     *   - Conviction damage
     *   - Other bonus damage
     *
     * after swadeRollDamage fires.
     *
     * Foundry's Roll.dice accessor gives us all DiceTerms
     * contained in the completed roll.
     */
    const brutalDice = this.dice.filter(
      term => term instanceof Die
    );


    /*
     * Apply Brutal to every die in the final damage roll.
     */
    for (const term of brutalDice) {

      /*
       * Add rr1 as the visible Brutal marker.
       *
       * Don't duplicate an existing rr1.
       */
      term.modifiers = term.modifiers.filter(
        modifier =>
          modifier !== "rr1" &&
          modifier !== "r1"
      );

      term.modifiers.push("rr1");


      /*
       * Save Foundry's normal modifier evaluator for this die.
       */
      const originalEvaluateModifiers = term._evaluateModifiers;


      /*
       * Replace it on this individual Die instance.
       */
      term._evaluateModifiers = async function () {

        const originalModifiers = [...this.modifiers];


        /*
         * Foundry normally evaluates modifiers sequentially.
         *
         * We do NOT want Foundry separately processing:
         *
         *   x
         *   rr1
         *
         * because that is what caused the original
         * 1 -> maximum interaction problem.
         *
         * Temporarily remove those modifiers.
         */
        this.modifiers = originalModifiers.filter(
          modifier =>
            modifier !== "rr1" &&
            modifier !== "r1" &&
            modifier !== "x"
        );


        /*
         * Process any OTHER Foundry modifiers normally.
         */
        await originalEvaluateModifiers.call(this);


        /*
         * Put the original modifiers back for display.
         */
        this.modifiers = originalModifiers;


        /*
         * Resolve Brutal rerolls and SWADE Acing together.
         */
        await resolveBrutalDie(this);
      };
    }


    /*
     * Evaluate the roll normally.
     *
     * The individual Brutal dice now have their custom
     * modifier evaluator installed.
     */
    return originalEvaluate.apply(this, args);
  };
});


/*
 * SWADE fires this hook when it initially constructs a damage roll.
 *
 * We use rr1 here primarily as a MARKER saying:
 *
 *     "This entire damage roll is Brutal."
 *
 * At this stage SWADE has not necessarily added Raise damage and
 * other bonus dice yet.
 */
Hooks.on(
  "swadeRollDamage",
  (actor, item, roll, modifiers, options) => {

    const hasBrutal =
      actor?.getFlag(
        "swade-brutal-damage",
        "brutal"
      ) ||
      item?.getFlag(
        "swade-brutal-damage",
        "brutal"
      );


    if (!hasBrutal || !roll?.terms) {
      return;
    }


    /*
     * Mark the original damage dice as Brutal.
     *
     * Later, when the FINAL DamageRoll is evaluated,
     * the code above sees this marker and applies Brutal
     * to every Die in the final roll.
     */
    for (const term of roll.terms) {

      if (!(term instanceof foundry.dice.terms.Die)) {
        continue;
      }

      term.modifiers = term.modifiers.filter(
        modifier =>
          modifier !== "rr1" &&
          modifier !== "r1"
      );

      term.modifiers.push("rr1");
    }
  }
);
Hooks.on("swadeRollDamage", (...args) => {
  console.group("SWADE Brutal Damage | swadeRollDamage DEBUG");

  console.log("Arguments:", args);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    console.log(`Argument ${i}:`, arg);

    if (arg?.terms) {
      console.log(
        `Argument ${i} terms:`,
        arg.terms.map(term => ({
          class: term.constructor?.name,
          formula: term.formula,
          number: term.number,
          faces: term.faces,
          modifiers: term.modifiers,
          results: term.results
        }))
      );
    }

    if (arg?.dice) {
      console.log(
        `Argument ${i} dice:`,
        arg.dice.map(term => ({
          class: term.constructor?.name,
          formula: term.formula,
          number: term.number,
          faces: term.faces,
          modifiers: term.modifiers,
          results: term.results
        }))
      );
    }
  }

  console.groupEnd();
});
