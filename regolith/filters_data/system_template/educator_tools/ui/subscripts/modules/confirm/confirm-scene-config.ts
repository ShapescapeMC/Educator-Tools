import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";

/**
 * Interface representing a button in a confirmation scene
 */
export interface ConfirmButton {
	/**
	 * The translation key for the button label
	 */
	label: string;

	/**
	 * The handler function that will be called when the button is clicked
	 * @param context - The current scene context
	 * @param manager - The scene manager
	 */
	handler: (context: SceneContext, manager: SceneManager) => void;
}

/**
 * Interface for configuring a confirmation scene
 */
export interface ConfirmSceneConfig {
	/**
	 * The translation key for the title (without the prefix)
	 */
	title: string;

	/**
	 * The translation key for the body text
	 */
	body: string;

	/**
	 * The buttons to display in the confirmation dialog
	 */
	buttons: ConfirmButton[];
}
