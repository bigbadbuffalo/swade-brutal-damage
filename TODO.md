# SWADE Weapon Properties — Development TODO

This file records future module work that has passed an initial feasibility check but is not yet scheduled for implementation.

## Per-Action / Special Ammunition Support

**Status:** Worth prototyping; deferred  
**Priority:** High value, medium-high implementation complexity  
**Target environment:** Foundry VTT 14 / SWADE 6.0.4+

### Problem

SWADE weapons currently define their ammunition at the **weapon level**. Weapon actions can override or customize several attack details—including the Trait used, attack/damage modifiers, damage, AP, and resource use—but they do not provide an equivalent per-action ammunition override.

That makes attacks such as **Armor-Piercing**, **Hollow-Point**, slugs, specialty arrows, or other ammunition-dependent attack modes awkward to automate. The action can represent the correct damage and AP, but SWADE's normal ammunition-management workflow still sees only the weapon's single configured ammunition type.

### Feasibility Verdict

This is worth attempting, but it should be implemented as an extension in **SWADE Weapon Properties**, not by maintaining a modified fork of the SWADE system.

SWADE already provides several pieces we can build around:

- Built-in ammunition management tracks weapon Shots and can pull compatible ammunition from actor inventory.
- Weapon actions already support action-specific resource consumption and combat-stat overrides.
- SWADE exposes `swadePreReloadWeapon` and `swadeReloadWeapon` hooks specifically around the reload workflow.
- SWADE exposes action hooks and a developer API intended to let modules extend the system.
- Modern SWADE also supports Action Items / Activities, which may provide a cleaner future place to attach module-owned ammunition metadata than modifying SWADE's strict action data model directly.

The largest difficulty is not choosing a different inventory item; it is keeping **loaded-ammunition state, weapon Shots, inventory quantities, reloads, and action selection synchronized without double-consuming ammunition**.

### Preferred Architecture

Do **not** add unsupported fields directly to SWADE's `system.actions` data unless a later investigation confirms the system explicitly allows it. SWADE uses strict DataModels, so module-owned metadata should live in `flags.swade-weapon-properties` or on a linked Action Item / Activity where possible.

A first prototype should aim for the following:

1. Give an attack action or linked Activity a module-owned **required / selected ammunition** reference, preferably by Item UUID or another stable identifier rather than display name alone.
2. Track the ammunition type currently loaded in a weapon with a module flag.
3. Use `swadePreReloadWeapon` / `swadeReloadWeapon` to let a reload choose the appropriate ammunition item and record the loaded type while allowing SWADE to continue handling Shots and inventory changes wherever possible.
4. When an attack action is used, verify that its required ammunition matches the weapon's loaded-ammunition state before the attack proceeds.
5. Continue using SWADE's native action overrides for Damage, AP, Trait, and resource use rather than reimplementing those systems.
6. Add item-sheet UI for assigning ammunition to actions only after the underlying resource workflow proves reliable.

### First-Version Scope

Keep the first version deliberately narrow:

- Assume a weapon is loaded with **one ammunition type at a time**.
- Support ordinary loose-ammunition and standard magazine / fixed-feed firearm workflows first.
- Make mixed cylinders, alternating shotgun shells, partially mixed magazines, and similar per-round loadouts a later feature or an explicit unsupported case.
- Preserve normal SWADE behavior when no action-level ammunition override is configured.
- Support worlds with SWADE ammunition management disabled without forcing inventory automation on them.

### Risks / Investigation Points

- Determine whether inline weapon actions have a stable identifier suitable for flag mappings. If not, linked Action Items / Activities may be the safer target.
- Determine the exact timing of action hooks relative to SWADE's Shot deduction and resource checks. The existing `swadeAction` hook occurs after a completed action roll and may be too late for validation, so a narrowly scoped wrapper or another pre-action hook may be necessary.
- Confirm whether reload hooks can safely redirect or substitute the ammunition item without temporarily mutating the weapon's canonical ammunition field.
- Test every supported reload procedure that matters to this project: loose rounds, fixed feeds, magazines, and no-reload/self-reload cases where appropriate.
- Prevent double accounting when SWADE has already consumed inventory ammunition during reload and the module is also tracking special ammunition.
- Keep any method wrapping as narrow as possible because private/internal SWADE methods may change between system releases.

### Go / No-Go Criterion

Proceed beyond prototype only if we can demonstrate all of the following without editing the installed SWADE system files:

- A weapon can select or load a special ammunition type.
- An action can require or select that ammunition type.
- The correct ammunition inventory is consumed exactly once.
- Weapon Shots remain correct.
- Standard SWADE attacks and reloads remain unchanged when the feature is not used.
- The implementation survives a system reload and does not require destructive mutation of weapon data between attacks.

If those conditions cannot be met with supported hooks plus a small, maintainable compatibility wrapper, leave special-ammunition consumption manual rather than maintaining a fragile SWADE fork.
