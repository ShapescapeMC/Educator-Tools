# About

This subsystem provides the in-game UI that educators access via the "Educator Tools" item. It contains the UI entry point, scene routing, and a modular set of features implemented as pluggable modules.

# Features

Available functionality is organized into modules and may include:

- Educator Tools home and navigation
- Teleport players
- Change player gamemode
- Timer (boss bar + optional entity display)
- World settings and management
- Lock players to an area
- Teams management
- Environment controls
- Focus mode
- Inventory management
- Health management
- Player status overview
- Assignments (assignment and assignment-item)

Note: Exact availability can vary by pack configuration and release.

# Code Structure

High-level layout of this subsystem:

- `main.ts`: UI entry point. Wires up the module system and opens the initial UI when the Educator Tools item is used.
- `languages.json`: Declares supported language keys for UI localization.
- `icons/`: Image assets used by the UI.
- `translations/`: Active localization files for supported languages.
- `translations_old/`: Legacy or archived localization files.
- `_scope.json`: system_template scope configuration for this subsystem.
- `_map.py`: Build-time mapping/helper for system_template.

## Subscripts

- `subscripts/module-manager.ts`: Central coordinator that registers modules, manages state for a UI interaction, and routes between scenes.
- `subscripts/utils/`: Shared utilities used across modules (form helpers, formatting, common predicates, etc.).
- `subscripts/modules/`: Feature modules. Each folder encapsulates a UI flow and related logic:
  - `main/`: Landing/home scene(s) and navigation.
  - `scene_manager/`: Scene switching and shared session state (supersedes the older standalone scene-manager).
  - `scenes/`: Reusable scenes and services (`not-enough-players.scene.ts`, `scenes.service.ts`, etc.).
  - `teleport/`: Teleport players to players/coordinates.
  - `gamemode/`: Change player gamemodes.
  - `timer/`: Start/stop/manage timers shown via boss bar; optional in-world timer entity.
  - `world_settings/` and `world_management/`: Change game rules and perform world-level actions without leaving the world.
  - `lock_player/`: Lock players within a defined radius or around coordinates.
  - `teams/`: Manage player teams.
  - `environment/`: Environment/time/weather controls.
  - `focus_mode/`: Configure focus/limited-interaction mode.
  - `inventory_manage/`: Bulk or per-player inventory actions.
  - `manage_health/`: Health/food effects and related actions.
  - `player_status/`: Overview of players and statuses.
  - `assignment/`, `assignment-item/`: Assignment-related flows.
  - `item/`, `confirm/`: Shared item utilities and confirmation dialogs used by multiple modules.

This module-based architecture replaces the previous monolithic structure (old scene-manager/ui-scene/world-data/mechanics). Each feature is scoped to its module, and shared functionality lives under `utils/` or `modules/scenes`.
