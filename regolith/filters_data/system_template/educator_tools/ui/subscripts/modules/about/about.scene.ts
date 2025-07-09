import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";

export class AboutScene extends ActionUIScene {
	static readonly id = "about";

	constructor(sceneManager: SceneManager, context: SceneContext) {
		super(AboutScene.id, context.getSourcePlayer());

		this.setSimpleBody("edu_tools.ui.about.body");

		this.addButton(
			"edu_tools.ui.about.buttons.back",
			(): void => {
				sceneManager.goBack(context);
			},
			"textures/edu_tools/ui/icons/back",
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
