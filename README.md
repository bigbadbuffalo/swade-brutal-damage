# SWADE Weapon Properties

A Foundry VTT module for **Savage Worlds Adventure Edition (SWADE)** that adds reusable custom weapon properties.

## Compatibility

Currently developed and tested with:

- **Foundry Virtual Tabletop:** Version 14
- **Savage Worlds Adventure Edition:** Version 6.0.4

Earlier versions are not currently supported or tested.

# Weapon Properties

## Brutal

**Brutal** modifies damage dice so that a result of **1** is discarded and rerolled until a result other than 1 is rolled. Normal SWADE Acing still applies, and the two mechanics interact recursively.

Example on a Brutal d6:

```text
1 → 6 → 6 → 1 → 3
```

The 1s are discarded, both 6s Ace, and the final result is **15**.

Brutal applies to all dice contributing to the damage roll, including Strength, weapon/base damage, Raise/Bonus Damage, Conviction, and other bonus damage dice. It also remains active on Benny and Free rerolls.

### Brutal Active Effect

```text
Attribute Key: flags.swade-weapon-properties.brutal
Change Mode:   Override
Effect Value:  true
```

Brutal dice display the `rr1` modifier in the damage roll.

---

## Off Hand

**Off Hand** allows a weapon to ignore SWADE's normal **−2 Off-Hand Penalty** when used in the off hand.

Off Hand does **not** grant or emulate Ambidextrous. It does not change SWADE's normal handling of Parry bonuses from multiple weapons.

### Off Hand Active Effect

```text
Attribute Key: flags.swade-weapon-properties.offhand
Change Mode:   Override
Effect Value:  true
```

The earlier `flags.swade-weapon-properties.offHand` spelling and former `flags.swade-weapon-properties.light` flag remain supported for backward compatibility with existing worlds and Active Effects, but new effects should use lowercase `offhand`.

Brutal and Off Hand may be used together on the same weapon.

# Minimum Strength Automation

Minimum Strength rules automation has moved to the separate **SWADE Minimum Strength Automation** module:

```text
https://github.com/bigbadbuffalo/swade-minimum-strength-automation
```

This module no longer registers Minimum Strength world settings or the former `flags.swade-weapon-properties.minStrBonus` flag.

# Scope

SWADE Weapon Properties is intentionally limited to reusable custom weapon properties and the code needed to implement them. Broader rules subsystems should live in dedicated modules when they have substantially different data, hook, or maintenance requirements.

# Installation

## Manifest Installation

```text
https://github.com/bigbadbuffalo/swade-weapon-properties/releases/latest/download/module.json
```

After installation, enable **SWADE Weapon Properties** from **Manage Modules** inside your SWADE world.

# Requirements

This module requires the **Savage Worlds Adventure Edition (SWADE)** game system.

No additional Foundry modules are required.

# License

This is an unofficial module for use with Foundry Virtual Tabletop and Savage Worlds Adventure Edition.

Foundry Virtual Tabletop and Savage Worlds Adventure Edition are the property of their respective owners.
