Hooks.once("ready", () => {
  const DamageRoll = CONFIG.Dice?.DamageRoll;

  if (!DamageRoll) {
    console.warn("SWADE Brutal Damage | Could not find DamageRoll.");
    return;
  }

  const Die = foundry.dice.terms.Die;
  const BRUTAL_OPTION = "swadeBrutalDamage";

  const originalEvaluate = DamageRoll.prototype.evaluate;
  const originalReroll = DamageRoll.prototype.reroll;

  function getDice(roll) {
    return roll.dice.filter(term => term instanceof Die);
  }

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

  function cleanDieModifiers(term) {
    const cleaned = [];
    let hasX = false;

    for (const modifier of term.modifiers ?? []) {
      if (modifier === "rr1" || modifier === "r1") {
        continue;
      }

      if (modifier === "x") {
        if (hasX) continue;

        hasX = true;
        cleaned.push("x");
        continue;
      }

      cleaned.push(modifier);
    }

    term.modifiers = cleaned;
  }

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

      if (!result || result.active === false) {
        index++;
        continue;
      }

      // Brutal: discard 1s and roll again.
      if (result.result === 1) {
        result.active = false;
        result.rerolled = true;

        await term.roll();

        index = term.results.length - 1;
        continue;
      }

      // SWADE Acing: keep maximum results and roll again.
      if (result.result === term.faces) {
        result.exploded = true;

        await term.roll();

        index = term.results.length - 1;
        continue;
      }

      index++;
    }
  }

  DamageRoll.prototype.evaluate = async function (...args) {
    if (!isBrutalRoll(this)) {
      return originalEvaluate.apply(this, args);
    }

    this.options[BRUTAL_OPTION] = true;

    const brutalDice = getDice(this);

    /*
     * Keep the stored roll formula clean so Foundry/SWADE can safely
     * reconstruct it for Benny and Free rerolls.
     */
    for (const term of brutalDice) {
      cleanDieModifiers(term);
    }

    this.resetFormula();

    /*
     * Apply Brutal to every die in the finalized damage roll and
     * evaluate Acing + Brutal together instead of as separate
     * Foundry modifiers.
     */
    for (const term of brutalDice) {
      term.modifiers.push("rr1");

      const originalEvaluateModifiers = term._evaluateModifiers;

      term._evaluateModifiers = async function () {
        const visibleModifiers = [...this.modifiers];

        this.modifiers = visibleModifiers.filter(
          modifier =>
            modifier !== "x" &&
            modifier !== "rr1" &&
            modifier !== "r1"
        );

        await originalEvaluateModifiers.call(this);

        this.modifiers = visibleModifiers;

        await resolveBrutalDie(this);
      };
    }

    return originalEvaluate.apply(this, args);
  };

  DamageRoll.prototype.reroll = async function (options = {}) {
    if (!isBrutalRoll(this)) {
      return originalReroll.call(this, options);
    }

    this.options[BRUTAL_OPTION] = true;

    /*
     * Foundry reconstructs rerolls from the stored formula.
     * Strip Brutal's display modifier and repair duplicate x modifiers
     * left by older versions of the module.
     */
    let cleanFormula = this.formula
      .replace(/rr1/g, "")
      .replace(/xx+/g, "x");

    const newOptions = foundry.utils.deepClone(this.options);
    newOptions[BRUTAL_OPTION] = true;

    const rerolled = new this.constructor(
      cleanFormula,
      this.data,
      newOptions
    );

    await rerolled.evaluate(options);

    return rerolled;
  };
});


Hooks.on(
  "swadeRollDamage",
  (actor, item, roll, modifiers, options) => {
    const hasBrutal =
      actor?.getFlag("swade-brutal-damage", "brutal") ||
      item?.getFlag("swade-brutal-damage", "brutal");

    if (!hasBrutal || !roll?.terms) {
      return;
    }

    roll.options.swadeBrutalDamage = true;

    /*
     * Mark the initial damage dice. DamageRoll.evaluate() will extend
     * Brutal to Raise, Conviction, and any other bonus dice added later.
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
