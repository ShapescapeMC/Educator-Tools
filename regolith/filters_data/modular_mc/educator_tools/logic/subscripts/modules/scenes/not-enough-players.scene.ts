import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";

export class NotEnoughPlayersScene extends ActionUIScene {
	static readonly id = "not_enough_players";

	constructor(sceneManager: SceneManager, context: SceneContext) {
		super(NotEnoughPlayersScene.id, context.getSourcePlayer());

		this.setSimpleBody("edu_tools.ui.not_enough_players.body");

		this.addButton(
			"edu_tools.ui.buttons.back",
			(): void => {
				sceneManager.goBack(context, 1);
			},
			"textures/edu_tools/ui/icons/_general/back",
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
