import { Module } from "../../module-manager";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { WorldManagementScene } from "./world_management.scene";

export class WorldManagementService implements Module {
	readonly id: string = "world_management";

	constructor() {}

	registerScenes(sceneManager: any): void {
		sceneManager.registerScene(
			"world_management",
			(manager: SceneManager, context: SceneContext) => {
				new WorldManagementScene(manager, context);
			},
		);
	}

	getMainButton(): any {
		return {
			labelKey: "edu_tools.ui.main.buttons.world_management",
			iconPath: "textures/edu_tools/ui/icons/main/world_management",
			handler: (sceneManager: any, context: any) => {
				sceneManager.openSceneWithContext(context, "world_management", true);
			},
			weight: 200,
		};
	}
}
