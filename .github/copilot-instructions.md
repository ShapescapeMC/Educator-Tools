## Educator Tools – AI Coding Guide

Concise working notes for AI agents contributing to this Minecraft Education add-on. Focus on patterns actually used in the repo.

### Core Purpose

Modular Minecraft Education Add-On providing classroom management (teams, assignments, focus mode, timers, world settings, etc.). Free and open-source (LGPL v3).

### Build & Profiles (Regolith)

Regolith drives generation of behavior/resource packs via filter profiles in `regolith/config.json`.
Common profiles:

- `educator_tools` – main add-on (education build target, whitelists `educator_tools`, `letter_blocks`, `scripting_setup`, `addon_setup/educator_tools`).
- `more_letter_blocks` – optional companion add-on (whitelists `addon_setup/more_letter_blocks`, `more_letter_blocks`).
- `debug` – adds `debug_say_function_name` filter on top of the default profile.
  Run builds via VS Code tasks or manually:

```powershell
cd regolith
regolith run            # default profile
regolith run educator_tools
regolith run more_letter_blocks
regolith run debug      # debug profile
```

### Scripts & Tooling

Install dependencies:

```powershell
\.scripts\install_dependencies.ps1  # npm install + regolith install-all
```

Build / Debug tasks call `\.scripts\build.ps1` / `debug.ps1` (adds Loopback exemptions for debugger).

### TypeScript & Bundling (ModularMC)

The project uses the **ModularMC** Regolith filter (successor to System Template). Full docs: <https://modular-mc-docs.readthedocs.io/en/stable/>.

ModularMC is a single filter (`modular_mc`) that handles both file mapping and script compilation:

- **Module folder**: any directory under `regolith/filters_data/modular_mc/` containing a `_map.ts` file becomes a module.
- **`_map.ts`**: TypeScript file exporting `MAP` (array of `{ source, target, … }` entries that map module files to BP/RP output paths) and/or `SCRIPTS` (array of TS/JS paths to compile with Esbuild).
- **Auto-mapping**: common file-suffix-to-output-path rules live in `regolith/filters_data/modular_mc/auto-map.ts` (e.g. `.block.json` → `BP/blocks`, `.behavior.json` → `BP/entities`).
- **Scope**: variables for JSON/text templates are passed via the `scope` property on each MAP entry (or imported from `regolith/filters_data/scope.json`). No implicit `_scope.json` merging – everything is explicit in `_map.ts`.
- **Esbuild**: configured per-profile in `config.json` under `esbuild.settings` (`outfile`, `sourcemap`, `minify`, `external`). Output goes to `BP/scripts/edu_tools/main.js`. Dependencies are managed through `regolith/deno.json` (Deno-style import map).
- **Script entry for Edu Tools**: `regolith/filters_data/modular_mc/educator_tools/logic/main.ts` → initializes `ModuleManager` on `world.afterEvents.worldLoad`. Scripts in `logic/subscripts/` are auto-collected via `getScriptFiles()` in the module's `_map.ts`.

### Module Pattern

`ModuleManager` (singleton) wires services from `logic/subscripts/modules/*/*.service.ts` implementing `Module` interface (`id`, optional `initialize`, `registerScenes`, `getMainButton`). Scene-centric navigation handled by `SceneManager` (singleton) with dynamic scene registry and history.
Add UI button: implement `getMainButton()` returning `{ labelKey, iconPath, handler, weight }` then let `ModuleManager` auto-register.

### Scenes & Navigation

Scenes registered via `sceneManager.registerScene(<name>, factory)`. Use a `SceneContext` to maintain history; back navigation uses `goBack()` or `goBackToScene()`. Script events consumed through `edu_tools:scene_manager` channel.

### Storage & Persistence

Per-module state stored with `@shapescape/storage` (`PropertyStorage`). Acquire sub-storage via `getSubStorage("<module>")`. For dynamic teams: `TeamsService` synthesizes system teams (teachers/students/all/player) and persists editable ones. Avoid direct world queries where cached storage exists.

### Adding a New Feature Module (Example)

1. Create folder `logic/subscripts/modules/<feature>/` (inside `modular_mc/educator_tools/`).
2. Implement `<feature>.service.ts` exporting `id`, optional `initialize`, `registerScenes`, and `getMainButton`.
3. Register any scenes in `registerScenes(sceneManager)`.
4. Use `ModuleManager` constructor sequence (automatic) – do NOT manually instantiate `ModuleManager`.
5. The module's `_map.ts` auto-collects all `.ts` files under `subscripts/` – no manual SCRIPTS registration needed.

### Adding a New ModularMC Module

1. Create a folder under `regolith/filters_data/modular_mc/<module_name>/`.
2. Add a `_map.ts` exporting `MAP` and/or `SCRIPTS`.
3. Use auto-mapping suffixes (see `auto-map.ts`) or explicit `{ source, target }` entries.
4. If scripts are needed, list them in `SCRIPTS` or use a helper like `getScriptFiles()`.
5. Whitelist the new module path in the appropriate profile in `regolith/config.json`.

### Manifest & Dependencies

Minecraft scripting modules declared in `modular_mc/scripting_setup/manifest.json` (entry: `scripts/edu_tools/main.js`, merged into BP via `onConflict: "merge"`). Dependencies pinned: `@minecraft/server` & `@minecraft/server-ui` @ 2.0.0. TS deps managed in `regolith/deno.json` (e.g. `@shapescape/storage`, `@bedrock-oss/bedrock-boost`). Local addon versioning via `regolith/filters_data/modular_mc/educator_tools/logic/subscripts/utils/addon-version.ts`.

### Naming & Internationalization

Localization keys follow `edu_tools.ui.<area>.<path>` (see `languages.json` / translation folders under `educator_tools/translations`). Weights in button configs control ordering (higher weight appears later or as defined by existing UI logic).

### Packaging vs Development

Release marketing assets live under `pack/educator_tools` and `pack/more_letter_blocks` – transformed by GitHub action `package_release.yml` (screenshots, keyart, panorama). These README files are not shipped. Do not place runtime code here.

### Conventions & Gotchas

- Always use singleton getters (`ModuleManager.getInstance()`, `SceneManager.getInstance(...)`).
- Do not mutate scene history directly; use provided navigation helpers.
- System team IDs prefixed with `system_`; never create custom teams starting with that.
- Player-specific teams cached offline with icon fallback (`player_offline`).
- Keep external list in `config.json` `esbuild.settings.external` array for native Minecraft modules – don't bundle them.
- The `_map.ts` files are TypeScript executed by Deno at build time; they can use `Deno.*` APIs (e.g. `Deno.readDirSync`).
- Scope variables from `scope.json` (namespace helpers) are imported explicitly in `auto-map.ts` and `_map.ts` files – not injected automatically.

### Quick Reference

Entry TS: `regolith/filters_data/modular_mc/educator_tools/logic/main.ts`
Module orchestrator: `module-manager.ts` (inside `logic/subscripts/`)
Scene system: `scene-manager.ts`, `scene-context.ts`
Teams example: `teams.service.ts` (scene registration + dynamic system teams)
Regolith profile config: `regolith/config.json`
Minecraft manifest: `modular_mc/scripting_setup/manifest.json`
Auto-mapping rules: `modular_mc/auto-map.ts`
Global scope variables: `regolith/filters_data/scope.json`
Dependency import map: `regolith/deno.json`
ModularMC docs: <https://modular-mc-docs.readthedocs.io/en/stable/>

Feedback welcome: clarify missing workflows (tests, release automation details) or request deeper module docs.
