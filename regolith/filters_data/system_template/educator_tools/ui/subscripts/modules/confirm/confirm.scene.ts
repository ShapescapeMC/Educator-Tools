import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { SceneContext } from "../scene_manager/scene-context";
import { ConfirmSceneConfig } from "./confirm-scene-config";

/**
 * Class representing the Confirmation Scene.
 */
export class ConfirmScene extends ActionUIScene {
	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		config: ConfirmSceneConfig,
	) {
		// Create the scene
		super(config.title || "confirm", context.getSourcePlayer());
		this.context = context;

		// Set the body text
		this.setSimpleBody(config.body);

		// Add buttons from the configuration
		if (config.buttons && config.buttons.length > 0) {
			config.buttons.forEach((button) => {
				this.addButton(button.label, () => {
					button.handler(context, sceneManager);
				});
			});
		} else {
			// Default button if none provided
			this.addButton("edu_tools.ui.buttons.continue", () => {
				sceneManager.goBack(context);
			});
		}

		// Show the scene
		this.show(context.getSourcePlayer(), sceneManager);
	}
}

// Export the interface for use in other files
export { ConfirmSceneConfig as Config } from "./confirm-scene-config";
