import { Module } from "../../module-manager";
import { ButtonConfig } from "../main/main.service";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { AboutScene } from "./about.scene";

export class AboutService implements Module {
	static readonly id = "about";
	public readonly id = AboutService.id;

	constructor() {}

	registerScenes(sceneManager: SceneManager): void {
		// Register the About scene
		sceneManager.registerScene(
			"about",
			(manager: SceneManager, context: SceneContext) => {
				new AboutScene(manager, context);
			},
		);
	}

	getMainButton(): ButtonConfig {
		return {
			labelKey: "edu_tools.ui.main.buttons.about",
			iconPath: "textures/edu_tools/ui/icons/main/about",
			handler: (sceneManager: SceneManager, context: SceneContext) => {
				sceneManager.openSceneWithContext(context, "about", true);
			},
			weight: 1000,
		};
	}
}
