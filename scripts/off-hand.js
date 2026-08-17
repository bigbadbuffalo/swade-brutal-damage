const SWP_MODULE_ID = "swade-weapon-properties";

Hooks.once("ready", () => {
  /*
   * Locate SWADE's weapon data model.
   */
  const WeaponData =
    CONFIG.Item?.dataModels?.weapon;

  if (!WeaponData) {
    console.warn(
      "SWADE Weapon Properties | Could not find SWADE WeaponData."
    );
    return;
  }

  /*
   * Find the existing traitModifiers getter.
   */
  const descriptor = Object.getOwnPropertyDescriptor(
    WeaponData.prototype,
    "traitModifiers"
  );

  if (!descriptor?.get) {
    console.warn(
      "SWADE Weapon Properties | Could not find WeaponData.traitModifiers."
    );
    return;
  }

  const originalTraitModifiers = descriptor.get;

  /*
   * Replace SWADE's traitModifiers getter while preserving all of
   * SWADE's normal modifier generation.
   */
  Object.defineProperty(
    WeaponData.prototype,
    "traitModifiers",
    {
      configurable: true,

      get: function () {
        /*
         * First let SWADE calculate everything normally.
         */
        const modifiers =
          originalTraitModifiers.call(this);

        /*
         * The Item document containing this weapon data.
         */
        const item = this.parent;

        /*
         * Off Hand is the canonical property flag. The former Light
         * flag remains supported so existing worlds and Active Effects
         * continue to function after the terminology change.
         */
        const hasOffHandProperty = Boolean(
          item?.getFlag(
            SWP_MODULE_ID,
            "offHand"
          ) ||
          item?.getFlag(
            SWP_MODULE_ID,
            "light"
          )
        );

        if (!hasOffHandProperty) {
          return modifiers;
        }

        /*
         * Off Hand removes ONLY the Off-Hand Penalty.
         *
         * It does not grant Ambidextrous and therefore does not
         * change SWADE's handling of Parry bonuses or any other
         * Ambidextrous behavior.
         */
        return modifiers.filter(
          modifier => {
            /*
             * SWADE normally identifies this modifier using its
             * localized Off-Hand Penalty label.
             */
            const offHandLabel =
              game.i18n.localize(
                "SWADE.OffHandPenalty"
              );

            return modifier.label !== offHandLabel;
          }
        );
      }
    }
  );
});
