Hooks.once("ready", () => {
  const DamageRoll = CONFIG.Dice?.DamageRoll;

  if (!DamageRoll) {
    console.warn(
      "SWADE Brutal Damage | Could not find DamageRoll."
    );
    return;
  }

  const Die = foundry.dice.terms.Die;

  /*
   * Internal option used to remember that a DamageRoll is Brutal.
   *
   * This is deliberately separate from the visible rr1 modifier.
   * That way a Benny reroll does not have to infer Brutal from the
   * text of the dice formula.
   */
  const BRUTAL_OPTION = "swadeBrutalDamage";


  const originalEvaluate = DamageRoll.prototype.evaluate;
  const originalReroll = DamageRoll.prototype.reroll;


  /**
   * Return every Die contained in the roll.
   */
  function getDice(roll) {
    return roll.dice.filter(
      term => term instanceof Die
    );
  }


  /**
   * Determine whether this DamageRoll is Brutal.
   *
   * Initial rolls are detected by the rr1 marker added by the
   * swadeRollDamage hook.
   *
   * Rerolled damage is detected by our custom Roll option.
   */
  function isBrutalRoll(roll) {
    if (roll.options?.[BRUTAL_OPTION] === true) {
      return true;
    }

    return getDice(roll).some(
      term =>
        term.modifiers?.includes("rr1") ||
        term.modifiers?.includes("r1")
    );
  }


  /**
   * Clean the modifiers of a Brutal die.
   *
   * The important goals are:
   *
   *   1. Remove rr1/r1 from the underlying reroll formula.
   *   2. Make sure ordinary SWADE Acing has only one "x".
   *
   * The visible rr1 marker will be added back AFTER the clean
   * formula has been stored.
   */
  function cleanDieModifiers(term) {
    const cleaned = [];
    let hasX = false;

    for (const modifier of term.modifiers ?? []) {

      /*
       * Remove Brutal markers from the underlying formula.
       */
      if (
        modifier === "rr1" ||
        modifier === "r1"
      ) {
        continue;
      }


      /*
       * Keep only one ordinary SWADE explosion modifier.
       *
       * This protects against the xrr1x corruption we saw on
       * Benny rerolls.
       */
      if (modifier === "x") {
        if (hasX) continue;

        hasX = true;
        cleaned.push("x");
        continue;
      }


      /*
       * Keep any unrelated modifier intact.
       */
      cleaned.push(modifier);
    }

    term.modifiers = cleaned;
  }


  /**
   * Resolve a Brutal die one result at a time.
   *
   * BRUTAL:
   *
   *   1 -> discard and reroll
   *
   * SWADE ACING:
   *
   *   maximum -> keep it and roll again
   *
   * The newly-generated result is immediately checked again.
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


      /*
       * Ignore results which have already been discarded.
       */
      if (!result || result.active === false) {
        index++;
        continue;
      }


      /*
       * BRUTAL
       *
       * A result of 1 does not contribute damage.
       * Discard it and immediately roll again.
       */
      if (result.result === 1) {
        result.active = false;
        result.rerolled = true;

        await term.roll();

        /*
         * term.roll() appends the new result.
         * Process that new result immediately.
         */
        index = term.results.length - 1;

        continue;
      }


      /*
       * SWADE ACING
       *
       * A maximum result contributes normally and generates
       * an additional roll.
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
       * Neither 1 nor maximum.
       *
       * This chain is finished.
       */
      index++;
    }
  }


  /**
   * Patch DamageRoll evaluation.
   */
  DamageRoll.prototype.evaluate = async function (...args) {

    /*
     * Ordinary non-Brutal damage rolls are completely untouched.
     */
    if (!isBrutalRoll(this)) {
      return originalEvaluate.apply(this, args);
    }


    /*
     * Permanently mark this Roll object as Brutal.
     *
     * This is important for Benny and Free rerolls.
     */
    this.options[BRUTAL_OPTION] = true;


    const brutalDice = getDice(this);


    /*
     * FIRST:
     *
     * Clean the actual Roll terms.
     *
     * At this point every die keeps normal SWADE "x", but the
     * custom rr1 marker is removed.
     */
    for (const term of brutalDice) {
      cleanDieModifiers(term);
    }


    /*
     * Rebuild the Roll's stored formula NOW.
     *
     * This is very important.
     *
     * The formula Foundry uses for a future reroll should look
     * like normal SWADE damage:
     *
     *     1d4x + 1d4x + 1d6x
     *
     * NOT:
     *
     *     1d4xrr1 + 1d4xrr1 + 1d6xrr1
     *
     * Brutal is remembered by BRUTAL_OPTION instead.
     */
    this.resetFormula();


    /*
     * SECOND:
     *
     * Add rr1 back to the live DiceTerms.
     *
     * We deliberately do NOT call resetFormula() again.
     *
     * This allows the chat card to display xrr1 while the
     * underlying stored reroll formula stays clean.
     */
    for (const term of brutalDice) {

      term.modifiers.push("rr1");


      /*
       * Save Foundry's original modifier evaluator for this die.
       */
      const originalEvaluateModifiers =
        term._evaluateModifiers;


      /*
       * Replace the evaluator on this individual DiceTerm.
       */
      term._evaluateModifiers = async function () {

        /*
         * Save the visible modifiers.
         */
        const visibleModifiers = [
          ...this.modifiers
        ];


        /*
         * Let Foundry process all unrelated modifiers normally.
         *
         * We handle:
         *
         *   x
         *   rr1
         *   r1
         *
         * ourselves.
         */
        this.modifiers = visibleModifiers.filter(
          modifier =>
            modifier !== "x" &&
            modifier !== "rr1" &&
            modifier !== "r1"
        );


        await originalEvaluateModifiers.call(this);


        /*
         * Restore the visible modifiers.
         */
        this.modifiers = visibleModifiers;


        /*
         * Now resolve Brutal and SWADE Acing together.
         */
        await resolveBrutalDie(this);
      };
    }


    /*
     * Evaluate the actual DamageRoll.
     */
    return originalEvaluate.apply(this, args);
  };


  /**
   * Patch DamageRoll.reroll().
   *
   * SWADE uses this method when spending a Benny or using a Free
   * reroll from the chat card.
   *
   * Foundry normally rebuilds a new Roll from the old formula.
   * For Brutal rolls, we explicitly create that new DamageRoll
   * ourselves and carry the Brutal option into it.
   */
  DamageRoll.prototype.reroll = async function (
    options = {}
  ) {

    /*
     * Ordinary damage rolls still use Foundry normally.
     */
    if (!isBrutalRoll(this)) {
      return originalReroll.call(
        this,
        options
      );
    }


    /*
     * Make absolutely certain the source roll remembers that
     * it is Brutal.
     */
    this.options[BRUTAL_OPTION] = true;


    /*
     * Start with Foundry's current formula.
     *
     * Older chat rolls may already contain xrr1 or xrr1x, so
     * sanitize those before recreating the Roll.
     */
    let cleanFormula = this.formula;


    /*
     * Remove our visible Brutal modifier.
     */
    cleanFormula = cleanFormula.replace(
      /rr1/g,
      ""
    );


    /*
     * Protect against formulas produced by the earlier version
     * of the module, such as:
     *
     *     1d4xrr1x
     *
     * After removing rr1 this becomes:
     *
     *     1d4xx
     *
     * Collapse duplicate x modifiers back to one x.
     */
    cleanFormula = cleanFormula.replace(
      /xx+/g,
      "x"
    );


    /*
     * Copy the Roll options and explicitly preserve Brutal.
     */
    const newOptions = foundry.utils.deepClone(
      this.options
    );

    newOptions[BRUTAL_OPTION] = true;


    /*
     * Recreate the same SWADE DamageRoll using the clean formula.
     *
     * Foundry's documented Roll.reroll() behavior is to construct
     * a fresh Roll from the original formula/data and evaluate it,
     * so this mirrors that behavior while allowing us to preserve
     * our Brutal state.
     */
    const rerolled = new this.constructor(
      cleanFormula,
      this.data,
      newOptions
    );


    /*
     * Evaluate the new roll.
     *
     * Our patched DamageRoll.evaluate() sees BRUTAL_OPTION and
     * automatically applies Brutal to ALL dice in the reroll:
     *
     *   - Strength
     *   - Weapon/base damage
     *   - Raise damage
     *   - Conviction
     *   - Custom bonus dice
     *   - Other added damage dice
     */
    await rerolled.evaluate(options);


    return rerolled;
  };
});


/*
 * INITIAL DAMAGE ROLL
 *
 * This hook fires when SWADE first constructs weapon damage.
 *
 * At this stage Raise damage and some other bonus dice may not
 * exist yet, so we only need to mark one or more original dice
 * with rr1.
 *
 * DamageRoll.evaluate() later sees that marker and applies Brutal
 * to EVERY die in the finalized DamageRoll.
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
     * Also place the persistent Brutal marker directly on the
     * Roll options as early as possible.
     */
    roll.options.swadeBrutalDamage = true;


    /*
     * Mark the original damage DiceTerms.
     *
     * The final DamageRoll.evaluate() patch will extend Brutal
     * to every other die which SWADE adds later.
     */
    for (const term of roll.terms) {

      if (!(term instanceof foundry.dice.terms.Die)) {
        continue;
      }


      /*
       * Remove any old Brutal marker.
       */
      term.modifiers = term.modifiers.filter(
        modifier =>
          modifier !== "rr1" &&
          modifier !== "r1"
      );


      /*
       * Add the marker.
       */
      term.modifiers.push("rr1");
    }
  }
);
