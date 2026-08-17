# SWADE Weapon Properties

A Foundry VTT module for **Savage Worlds Adventure Edition (SWADE)** that adds custom weapon properties and optional rules automation for equipment and Minimum Strength.

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

# Optional Minimum Strength Automation

The module includes three independent world settings under **Configure Settings → SWADE Weapon Properties**. All are disabled by default.

## Enforce Strength-Limited Weapon Damage

Enforces the SWADE rule that the base damage die of a Strength-based melee or thrown weapon cannot exceed the wielder's **actual Strength die**.

Examples:

```text
Strength d4 + Str+d8 weapon → d4+d4
Strength d6 + Str+d10+2 weapon → d6+d6+2
```

This affects only the weapon's base damage die. Raise damage, Conviction, other bonus dice, and fixed-damage weapons are unaffected.

## Enforce Armor Minimum Strength Penalties

When enabled, equipped armor applies the normal Minimum Strength penalties for each die step the wearer is below the item's Minimum Strength:

- −1 Pace
- −1 Agility
- −1 to Agility-linked skill rolls

Penalties from multiple equipped armor items are cumulative. Pace cannot be reduced below 1.

The module checks each skill's actual linked Attribute rather than using a hard-coded list, so custom skills and effects that change a skill's linked Attribute are respected.

## Enforce Ranged Weapon Minimum Strength Penalties

When enabled, attacks with ranged weapons suffer **−1 per die step** the wielder is below the weapon's Minimum Strength.

Melee and thrown weapons are excluded from this ranged attack penalty.

# Effective Minimum Strength Bonuses

Some abilities, such as **Brawny** or **Soldier**, may allow a character to count Strength as higher for Minimum Strength purposes without actually increasing the Strength die.

SWADE Weapon Properties uses its own additive flag for this purpose:

```text
Attribute Key: flags.swade-weapon-properties.minStrBonus
Change Mode:   Add
Effect Value:  1
```

A value of `1` means one die step higher for Minimum Strength purposes. Multiple effects stack normally.

For example:

```text
Strength d6
Brawny:  +1 step
Soldier: +1 step

Effective Minimum Strength: d10
```

This bonus is used by the **Armor Minimum Strength Penalties** and **Ranged Weapon Minimum Strength Penalties** automation.

It does **not** increase actual Strength and therefore does not increase the Strength-limited weapon damage cap.

The module intentionally does not automatically interpret SWADE's `system.attributes.strength.encumbranceSteps` value as a Minimum Strength bonus. Add the `minStrBonus` flag to any Edge, ability, or Active Effect that should affect Minimum Strength.

# Scope of Minimum Strength Automation

The module does not fully automate every consequence of failing Minimum Strength.

In particular, it does **not** automatically suppress positive melee/thrown weapon abilities such as Reach or Parry bonuses when the wielder fails to meet the weapon's Minimum Strength. Those effects remain manual.

# Development Roadmap

Future work that has passed an initial feasibility review is tracked in [TODO.md](TODO.md). This includes a planned prototype for **per-action / special ammunition support** so weapon actions can eventually coordinate their Damage/AP overrides with the correct ammunition inventory and reload state.

# Installation

## Manifest Installation

In Foundry VTT:

1. Open **Add-on Modules**.
2. Select **Install Module**.
3. Paste the manifest URL into the **Manifest URL** field.
4. Select **Install**.

```text
https://github.com/bigbadbuffalo/swade-weapon-properties/releases/latest/download/module.json
```

After installation, enable **SWADE Weapon Properties** from **Manage Modules** inside your SWADE world.

## Manual Installation

Download the module release and place the `swade-weapon-properties` folder inside:

```text
FoundryVTT/Data/modules/
```

Restart Foundry VTT and enable the module from **Manage Modules**.

# Requirements

This module requires the **Savage Worlds Adventure Edition (SWADE)** game system.

No additional Foundry modules are required.

# Reporting Bugs

Report problems at:

```text
https://github.com/bigbadbuffalo/swade-weapon-properties/issues
```

Useful information includes:

- Foundry VTT version
- SWADE system version
- Relevant weapon or armor configuration
- Relevant Active Effects
- Which Minimum Strength settings are enabled
- Character Strength and effective Minimum Strength bonuses
- A screenshot of the roll or behavior, if applicable

# License

This is an unofficial module for use with Foundry Virtual Tabletop and Savage Worlds Adventure Edition.

Foundry Virtual Tabletop and Savage Worlds Adventure Edition are the property of their respective owners.
