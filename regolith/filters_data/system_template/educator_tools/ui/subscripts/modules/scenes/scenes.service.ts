import { Module } from "../../module-manager";
import { SceneManager } from "../scene_manager/scene-manager";
import { SceneContext } from "../scene_manager/scene-context";
import { NotEnoughPlayersScene } from "./not-enough-players.scene";
import { NoTeamsScene } from "./no-teams.scene";

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
