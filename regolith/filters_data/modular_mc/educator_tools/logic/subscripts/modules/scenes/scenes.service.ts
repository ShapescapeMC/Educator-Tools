import { Module } from "../../module-manager.ts";
import { SceneManager } from "../scene_manager/scene-manager.ts";
import { SceneContext } from "../scene_manager/scene-context.ts";
import { NotEnoughPlayersScene } from "./not-enough-players.scene.ts";
import { NoTeamsScene } from "./no-teams.scene.ts";

export class ScenesService implements Module {
	static readonly id = "scenes";
	public readonly id = ScenesService.id;

	constructor() {}

	/**
	 * Registers scenes related to gamemode management.
	 * @param sceneManager - The scene manager
	 */
	registerScenes(sceneManager: SceneManager): void {
		sceneManager.registerScene(
			NotEnoughPlayersScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new NotEnoughPlayersScene(manager, context);
			},
		);
		sceneManager.registerScene(
			NoTeamsScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new NoTeamsScene(manager, context);
			},
		);
	}
}
