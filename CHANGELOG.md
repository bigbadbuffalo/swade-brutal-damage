# Changelog

All notable changes to **SWADE Weapon Properties** will be documented in this file.

## [Unreleased]

## [1.1.0] - 2026-08-17

### Changed

- Refocused **SWADE Weapon Properties** on reusable custom weapon properties.
- Moved all Minimum Strength rules automation to the separate **SWADE Minimum Strength Automation** module.
- Removed the Minimum Strength world settings, helper code, attack/damage/actor hooks, and `flags.swade-weapon-properties.minStrBonus` from this module.
- Removed the special-ammunition roadmap from this repository; ammunition automation will be evaluated separately rather than assumed to belong to Weapon Properties.
- Updated the welcome message and README to reflect the narrower module scope.

### Retained

- **Brutal** damage automation.
- **Off Hand** weapon automation and its compatibility aliases.

### Migration

- Minimum Strength features now live at `bigbadbuffalo/swade-minimum-strength-automation`.
- Effective Minimum Strength bonuses now use `flags.swade-minimum-strength-automation.minStrBonus`.
- No compatibility shim is provided because the split occurred before public release.

## Historical 1.0.x

Versions 1.0.0 through 1.0.10 developed Brutal, Off Hand, and the Minimum Strength automation that was subsequently split into its own module. Detailed pre-split history remains available in Git history and the corresponding tags/commits.

[Unreleased]: https://github.com/bigbadbuffalo/swade-weapon-properties/compare/1.1.0...HEAD
[1.1.0]: https://github.com/bigbadbuffalo/swade-weapon-properties/compare/1.0.10...1.1.0
