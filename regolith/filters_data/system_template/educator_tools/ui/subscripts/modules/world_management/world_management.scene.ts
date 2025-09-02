import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";

export class WorldManagementScene extends ActionUIScene {
	static readonly id = "world_management";

	constructor(sceneManager: SceneManager, context: SceneContext) {
		super(WorldManagementScene.id, context.getSourcePlayer());

		this.setContext(context);
		this.setSimpleBody("edu_tools.ui.world_management.body");

		this.addButton(
			"edu_tools.ui.world_management.buttons.world_settings",
			(): void => {
				sceneManager.openSceneWithContext(context, "world_settings", true);
			},
			"textures/edu_tools/ui/icons/world_management/world_settings",
		);

		this.addButton(
			"edu_tools.ui.world_management.buttons.environment",
			(): void => {
				sceneManager.openSceneWithContext(context, "environment", true);
			},
			"textures/edu_tools/ui/icons/world_management/environment",
		);

		this.addButton(
			"edu_tools.ui.buttons.back",
			() => {
				sceneManager.goBackToScene(context, "main");
			},
			"textures/edu_tools/ui/icons/_general/back",
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
