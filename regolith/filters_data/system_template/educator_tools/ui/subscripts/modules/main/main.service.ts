import { Module } from "../../module-manager";
import { SceneManager } from "../scene_manager/scene-manager";
import { MainScene } from "./main.scene";
import { SceneContext } from "../scene_manager/scene-context";

/**
 * Interface for button configuration
 */
export interface ButtonConfig {
	labelKey: string;
	iconPath: string;
	handler: (sceneManager: SceneManager, context: SceneContext) => void;
	weight?: number; // Optional weight for sorting buttons
}

/**
 * Service for managing the main menu.
 */
export class MainService implements Module {
	/**
	 * Unique identifier for the module.
	 */
	readonly id: string = "main";

	/**
	 * Registry of buttons for the main menu
	 */
	private buttonRegistry: Map<string, ButtonConfig> = new Map();

	/**
	 * Registers a button with its configuration
	 * @param buttonId - Unique identifier for the button
	 * @param config - Button configuration including label, icon, and handler
	 */
	public registerButton(buttonId: string, config: ButtonConfig): void {
		this.buttonRegistry.set(buttonId, config);
	}

	/**
	 * Gets all registered buttons sorted by weight.
	 * Buttons with higher weight will appear later in the list.
	 * @returns Map of button configurations
	 */
	public getRegisteredButtons(): Map<string, ButtonConfig> {
		const sortedButtons = new Map(
			[...this.buttonRegistry.entries()].sort((a, b) => {
				const weightA = a[1].weight || 0;
				const weightB = b[1].weight || 0;
				return weightA - weightB; // Sort in descending order
			}),
		);
		return sortedButtons;
	}

	/**
	 * Registers all scenes related to the main menu.
	 * @param sceneManager - The SceneManager to register scenes with.
	 */
	public registerScenes(sceneManager: SceneManager): void {
		// Register default buttons
		this.registerDefaultButtons();

		sceneManager.registerScene(
			MainScene.id,
			(manager: SceneManager, context: SceneContext) => {
				// Create a new instance of MainScene with this service
				new MainScene(manager, context, this);
			},
		);
	}

	/**
	 * Registers the default buttons for the main menu
	 */
	private registerDefaultButtons(): void {
		this.registerButton("exit", {
			labelKey: "edu_tools.ui.buttons.exit",
			iconPath: "textures/edu_tools/ui/icons/_general/exit",
			handler: (sceneManager: SceneManager, context: SceneContext) => {
				// Exit handler - currently empty
			},
			weight: 100000, // Ensure exit button is always last
		});
	}
}
