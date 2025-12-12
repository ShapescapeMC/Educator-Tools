## Educator Tools – AI Coding Guide

Concise working notes for AI agents contributing to this Minecraft Education add-on. Focus on patterns actually used in the repo.

### Core Purpose

Modular Minecraft Education Add-On providing classroom management (teams, assignments, focus mode, timers, world settings, etc.). Free and open-source (LGPL v3).

### Build & Profiles (Regolith)

Regolith drives generation of behavior/resource packs via filter profiles in `regolith/config.json`.
Common profiles:

- `educator_tools` – main add-on (education build target, includes `educator_tools/**`, `letter_blocks`, `addon_setup/educator_tools`).
- `more_letter_blocks` – optional companion add-on.
- `debugger` – writes to `debugger/bp` & `debugger/rp` with sourcemaps.
  Run builds via VS Code tasks or manually:

```powershell
cd regolith
regolith run            # default profile
regolith run educator_tools
regolith run more_letter_blocks
regolith run debugger   # debug profile
```

### Scripts & Tooling

Install dependencies:

```powershell
\.scripts\install_dependencies.ps1  # npm install + regolith install-all
```

Build / Debug tasks call `\.scripts\build.ps1` / `debug.ps1` (adds Loopback exemptions for debugger).

### TypeScript & Bundling

System template uses two filters:

- `system_template` – maps modular folder structure using `_map.py` & `_scope.json`.
- `system_template_esbuild` – bundles TS entry `system_template_esbuild/main.ts` (placeholder) into `BP/scripts/{path_namespace}/main.js`.
  Runtime entry for Edu Tools UI is `system_template/educator_tools/ui/main.ts` → initializes `ModuleManager` on `world.afterEvents.worldLoad`.

### Module Pattern

`ModuleManager` (singleton) wires services from `ui/subscripts/modules/*/*.service.ts` implementing `Module` interface (`id`, optional `initialize`, `registerScenes`, `getMainButton`). Scene-centric navigation handled by `SceneManager` (singleton) with dynamic scene registry and history.
Add UI button: implement `getMainButton()` returning `{ labelKey, iconPath, handler, weight }` then let `ModuleManager` auto-register.

### Scenes & Navigation

Scenes registered via `sceneManager.registerScene(<name>, factory)`. Use a `SceneContext` to maintain history; back navigation uses `goBack()` or `goBackToScene()`. Script events consumed through `edu_tools:scene_manager` channel.

### Storage & Persistence

Per-module state stored with `@shapescape/storage` (`PropertyStorage`). Acquire sub-storage via `getSubStorage("<module>")`. For dynamic teams: `TeamsService` synthesizes system teams (teachers/students/all/player) and persists editable ones. Avoid direct world queries where cached storage exists.

### Adding a New Feature Module (Example)

1. Create folder `ui/subscripts/modules/<feature>/`.
2. Implement `<feature>.service.ts` exporting `id`, optional `initialize`, `registerScenes`, and `getMainButton`.
3. Register any scenes in `registerScenes(sceneManager)`.
4. Use `ModuleManager` constructor sequence (automatic) – do NOT manually instantiate `ModuleManager`.

### Manifest & Dependencies

Minecraft scripting modules declared in `system_template/scripting_setup/manifest.json` (entry: `scripts/edu_tools/main.js`). Dependencies pinned: `@minecraft/server` & `@minecraft/server-ui` @ 2.0.0. Additional TS deps in `regolith/filters_data/package.json` (e.g. `@shapescape/storage`, `bedrock-boost`). Local addon versioning via `system_template_esbuild/addon-version` package.

### Naming & Internationalization

Localization keys follow `edu_tools.ui.<area>.<path>` (see `languages.json` / translation folders under `ui/translations`). Weights in button configs control ordering (higher weight appears later or as defined by existing UI logic).

### Packaging vs Development

Release marketing assets live under `pack/educator_tools` and `pack/more_letter_blocks` – transformed by GitHub action `package_release.yml` (screenshots, keyart, panorama). These README files are not shipped. Do not place runtime code here.

### Conventions & Gotchas

- Always use singleton getters (`ModuleManager.getInstance()`, `SceneManager.getInstance(...)`).
- Do not mutate scene history directly; use provided navigation helpers.
- System team IDs prefixed with `system_`; never create custom teams starting with that.
- Player-specific teams cached offline with icon fallback (`player_offline`).
- Keep external list in `config.json` `external` array (esbuild) for native Minecraft modules – don’t bundle them.

### Quick Reference

Entry TS: `regolith/filters_data/system_template/educator_tools/ui/main.ts`
Module orchestrator: `module-manager.ts`
Scene system: `scene-manager.ts`, `scene-context.ts`
Teams example: `teams.service.ts` (scene registration + dynamic system teams)
Regolith profile config: `regolith/config.json`
Minecraft manifest: `system_template/scripting_setup/manifest.json`

Feedback welcome: clarify missing workflows (tests, release automation details) or request deeper module docs.
