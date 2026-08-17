# Changelog

All notable changes to **SWADE Weapon Properties** will be documented in this file.

## [Unreleased]

## [1.0.6] - 2026-08-16

### Changed

- Renamed the custom **Light** weapon property to **Off Hand** to avoid ambiguity with weapon class, size, and weight terminology.
- The canonical Active Effect flag is now `flags.swade-weapon-properties.offhand`.
- Renamed the automation script from `light.js` to `off-hand.js`.
- Updated the module description, README, and welcome message to use the new terminology.
- Increased the welcome-message revision so existing worlds receive the updated flag documentation once.

### Compatibility

- The earlier `flags.swade-weapon-properties.offHand` spelling and former `flags.swade-weapon-properties.light` flag remain supported for backward compatibility with existing items and Active Effects.
- Existing legacy effects do not need to be rebuilt immediately, but new effects should use `flags.swade-weapon-properties.offhand`.

## [1.0.5] - 2026-08-16

### Added

- Added a one-time welcome/documentation chat message for each world.
- The message summarizes the module's primary Active Effect flags:
  - `flags.swade-weapon-properties.brutal`
  - `flags.swade-weapon-properties.light`
  - `flags.swade-weapon-properties.minStrBonus`
- Added a direct link from the welcome message to the project README for setup instructions and examples.
- Added an internal versioned world setting so the welcome message is not posted on every world load and can be intentionally shown again after future major documentation updates.
- Only a GM creates the world-level welcome message, preventing duplicate messages from connected player clients.

## [1.0.4] - 2026-08-16

### Bugfix

- Fixed Pace not auto-updating when enabling or disabling the Armor Minimum Strength rule.

## [1.0.3] - 2026-08-16

### Added

#### Minimum Strength Automation

- Added an optional **Enforce Armor Minimum Strength Penalties** world setting.
- When enabled, equipped armor applies cumulative Minimum Strength penalties of −1 Pace, −1 Agility, and −1 to Agility-linked skill rolls for each die step the wearer is below an item's Minimum Strength.
- Added an optional **Enforce Ranged Weapon Minimum Strength Penalties** world setting.
- When enabled, ranged weapon attacks suffer −1 per die step the wielder is below the weapon's Minimum Strength.
- Melee and thrown weapons are excluded from the ranged attack penalty.
- Added the additive Active Effect flag `flags.swade-weapon-properties.minStrBonus` for abilities that increase effective Strength for Minimum Strength purposes.
- Effective Minimum Strength bonuses stack normally, allowing effects such as Brawny and Soldier to each contribute one die step without modifying the character's actual Strength.
- The new Minimum Strength penalty automation remains independent from the existing Strength-limited damage automation.

### Notes

- Minimum Strength automation does not attempt to suppress positive weapon abilities such as Reach or Parry when a melee/thrown weapon's Minimum Strength is not met.
- The module does not automatically interpret SWADE's `system.attributes.strength.encumbranceSteps` as a Minimum Strength bonus; the dedicated module flag must be used instead.

## [1.0.2] - 2026-08-15

### Added

- Added optional enforcement of SWADE's Strength-limited melee/thrown weapon damage rule.
- Added the **Enforce Strength-Limited Weapon Damage** world setting.
- When enabled, a Strength-based weapon's base damage die cannot exceed the wielder's actual Strength die.
- Raise damage, Conviction, other bonus damage dice, and fixed-damage weapons are unaffected.

## [1.0.1] - 2026-08-13

### Added

- Expanded the module from Brutal-only damage automation into **SWADE Weapon Properties**.
- Added the **Light** weapon property.
- Light weapons ignore SWADE's −2 Off-Hand Penalty when used in the off hand.
- Light does not grant or emulate Ambidextrous and does not alter normal Parry-bonus handling.
- Brutal and Light may be used simultaneously on the same weapon.

## [1.0.0] - 2026-08-13

### Added

- Initial public release.
- Added the **Brutal** damage property.
- Brutal damage dice reroll results of `1` until a result other than `1` is rolled.
- Brutal rerolls interact correctly with normal SWADE Acing.
- Brutal applies to all dice contributing to a damage roll, including Strength, weapon/base damage, Raise/Bonus Damage, Conviction, and other bonus damage dice.
- Brutal remains active when damage is rerolled with a **Benny** or **Free Reroll**.
- Brutal can be applied with `flags.swade-weapon-properties.brutal`.
- Added safeguards against runaway recursive dice rolls.

### Compatibility

- Foundry Virtual Tabletop v14.
- Savage Worlds Adventure Edition v6.0.4.

[Unreleased]: https://github.com/bigbadbuffalo/swade-weapon-properties/compare/1.0.6...HEAD
[1.0.6]: https://github.com/bigbadbuffalo/swade-weapon-properties/compare/1.0.5...1.0.6
[1.0.5]: https://github.com/bigbadbuffalo/swade-weapon-properties/compare/1.0.4...1.0.5
[1.0.4]: https://github.com/bigbadbuffalo/swade-weapon-properties/compare/1.0.3...1.0.4
[1.0.3]: https://github.com/bigbadbuffalo/swade-weapon-properties/compare/1.0.2...1.0.3
[1.0.2]: https://github.com/bigbadbuffalo/swade-weapon-properties/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/bigbadbuffalo/swade-weapon-properties/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/bigbadbuffalo/swade-weapon-properties/releases/tag/1.0.0
