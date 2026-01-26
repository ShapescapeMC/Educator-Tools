import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { SceneContext } from "../scene_manager/scene-context";
import { MainService } from "./main.service";
import { getAddonVersion } from "../../utils/addon-version";

/**
 * Class representing the Main Scene.
 */
export class MainScene extends ActionUIScene {
	static readonly id = "main";
	/**
	 * Creates an instance of MainScene.
	 * @param sceneManager - The SceneManager instance.
	 * @param context - The SceneContext instance.
	 * @param mainService - The MainService instance for button registration.
	 */
	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		mainService: MainService,
	) {
		super(MainScene.id, context.getSourcePlayer());

		// Set the context for this scene
		this.setContext(new SceneContext(context.getSourcePlayer()));

		this.setSimpleBody("edu_tools.ui.main.body");

		// Add buttons from the service registry
		const registeredButtons = mainService.getRegisteredButtons();
		for (const [buttonId, config] of registeredButtons) {
			this.addButton(
				config.labelKey,
				(): void => {
					config.handler(sceneManager, context);
				},
				config.iconPath,
			);
		}

		this.addDivider();
		this.addLabel("Made with ❤ by Shapescape - " + getAddonVersion());

		// Show the UI to the source player
		this.show(context.getSourcePlayer(), sceneManager);
	}
}
