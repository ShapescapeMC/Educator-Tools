import {
	Player,
	ScriptEventCommandMessageAfterEvent,
	ScriptEventCommandMessageAfterEventSignal,
	system,
} from "@minecraft/server";
import { PropertyStorage } from "@shapescape/storage";
import { ModuleManager, Module } from "../../module-manager";
import { TeamsService } from "../teams/teams.service";
import { SceneContext } from "./scene-context";
import { ConfirmSceneConfig } from "../confirm/confirm-scene-config";
import { MainScene } from "../main/main.scene";
import { ConfirmScene } from "../confirm/confirm.scene";

type SceneFactory = (
	manager: SceneManager,
	context: SceneContext,
	...args: any[]
) => void;

/**
 * Class representing the Scene Manager.
 * This class is responsible for managing scene navigation and storing references
 * to required services.
 */
export class SceneManager implements Module {
	readonly id: string = "scene_manager";
	private static instance: SceneManager | undefined;
	private sceneRegistry: Map<string, SceneFactory> = new Map();
	private readonly storage: PropertyStorage;
	private moduleManager: ModuleManager;

	/**
	 * Returns the singleton instance of SceneManager.
	 * @param storage - The base storage for the application (only used on first call).
	 */
	public static getInstance(
		moduleManager?: ModuleManager,
		storage?: PropertyStorage,
	): SceneManager {
		if (!SceneManager.instance) {
			if (!storage || !moduleManager) {
				throw new Error(
					"SceneManager not initialized: storage and module manager required on first call.",
				);
			}
			SceneManager.instance = new SceneManager(moduleManager, storage);
		}
		return SceneManager.instance;
	}

	/**
	 * Private constructor for singleton pattern.
	 * @param storage - The base storage for the application.
	 */
	private constructor(moduleManager: ModuleManager, storage: PropertyStorage) {
		this.storage = storage;
		this.moduleManager = moduleManager;

		// Register core scenes
		this.registerCoreScenes();

		// Register scenes from all modules
		this.moduleManager.registerAllModuleScenes(this);
	}

	initialize(): void {
		system.afterEvents.scriptEventReceive.subscribe(
			(scriptMessage: ScriptEventCommandMessageAfterEvent) => {
				if (scriptMessage.id === "edu_tools:scene_manager") {
					this.handleScriptCommand(scriptMessage);
				}
			},
		);
	}

	private handleScriptCommand(
		scriptMessage: ScriptEventCommandMessageAfterEvent,
	) {
		const args = scriptMessage.message.toLowerCase().split(" ");
		const command = args.shift()?.toLowerCase();
		switch (command) {
			case "open":
				if (args.length < 1) {
					console.error("No scene name provided to open command.");
					return;
				}
				const sceneName = args[0];
				const context = this.createContextAndOpenScene(
					scriptMessage.sourceEntity as Player,
					sceneName,
					...args.slice(1),
				);
				this.openSceneWithContext(context, sceneName, true);
				break;
		}
	}

	/**
	 * Registers core scenes that don't belong to specific modules.
	 */
	private registerCoreScenes(): void {
		this.registerScene(
			"confirm",
			(
				manager: SceneManager,
				context: SceneContext,
				config: ConfirmSceneConfig,
			) => {
				new ConfirmScene(manager, context, config);
			},
		);
	}

	/**
	 * Registers a specific scene by name.
	 * This is made public so modules can register their scenes.
	 * @param sceneName - The name of the scene.
	 * @param factory - The scene factory function.
	 */
	public registerScene(sceneName: string, factory: SceneFactory): void {
		if (this.sceneRegistry.has(sceneName)) {
			console.warn(`Scene ${sceneName} is already registered. Overwriting.`);
		}
		this.sceneRegistry.set(sceneName, factory);
	}

	/**
	 * Creates a new context and opens a scene.
	 * @param sourcePlayer - The player opening the scene.
	 * @param sceneName - The name of the scene to open.
	 * @param args - Arguments to pass to the scene.
	 * @returns The created context.
	 */
	public createContextAndOpenScene(
		sourcePlayer: Player,
		sceneName: string,
		...args: any[]
	): SceneContext {
		const context = new SceneContext(sourcePlayer);
		return this.openSceneWithContext(context, sceneName, true, ...args);
	}

	/**
	 * Opens a scene with an existing context.
	 * @param context - The context to use.
	 * @param sceneName - The name of the scene to open.
	 * @param args - Arguments to pass to the scene.
	 * @returns The updated context.
	 */
	public openSceneWithContext(
		context: SceneContext,
		sceneName: string,
		addToHistory: boolean,
		...args: any[]
	): SceneContext {
		if (addToHistory) {
			context.addToHistory(sceneName);
		}
		const sceneFactory = this.sceneRegistry.get(sceneName);

		if (sceneFactory) {
			sceneFactory(this, context, ...args);
		} else {
			console.error(`Scene '${sceneName}' not found in registry`);
		}

		return context;
	}

	/**
	 * Navigates to the previous scene in the context's history.
	 * @param context - The context containing the history.
	 */
	public goBack(context: SceneContext, steps: number = 1): void {
		if (steps < 1) {
			console.warn("goBack called with steps less than 1, ignoring.");
			return;
		}
		// Ensure we have enough history to go back
		if (context.getHistory().length < steps) {
			// If we can't go back, we return to the main scene
			this.createContextAndOpenScene(context.getSourcePlayer(), MainScene.id);
			return;
		}
		// Remove the last 'steps' entries from history
		let previousSceneId =
			context.getHistory()[context.getHistory().length - steps - 1] ||
			MainScene.id;
		for (let i = 0; i < steps; i++) {
			context.getHistory().pop();
		}
		// If the history is now empty, we can return to the main scene
		if (context.getHistory().length === 0) {
			this.openSceneWithContext(context, MainScene.id, true);
		} else {
			const sceneFactory = this.sceneRegistry.get(previousSceneId);
			if (sceneFactory) {
				sceneFactory(this, context);
			}
		}
	}

	/**
	 * Navigates back to a specific scene in the history and clears all history after that scene.
	 * @param context - The context containing the history.
	 * @param targetSceneId - The ID of the scene to go back to.
	 * @returns True if the scene was found and navigated to, false otherwise.
	 */
	public goBackToScene(context: SceneContext, targetSceneId: string): boolean {
		const history = context.getHistory();
		const targetIndex = history.lastIndexOf(targetSceneId);

		if (targetIndex === -1) {
			console.warn(`Scene '${targetSceneId}' not found in history.`);
			return false;
		}

		// Remove all history entries after the target scene
		history.splice(targetIndex + 1);
		context.setHistory(history);

		// Navigate to the target scene without adding to history
		const sceneFactory = this.sceneRegistry.get(targetSceneId);
		if (sceneFactory) {
			sceneFactory(this, context);
			return true;
		} else {
			console.error(`Scene '${targetSceneId}' not found in registry`);
			return false;
		}
	}

	/**
	 * Processes a scene submission by navigating to the next scene if set.
	 * @param context - The context containing the next scene information.
	 */
	public submitScene(context: SceneContext): void {
		const [nextScene, nextSceneArgs] = context.getNextScene();
		if (nextScene) {
			this.openSceneWithContext(context, nextScene, true, ...nextSceneArgs);
			context.clearNextScene();
		}
	}

	/**
	 * Gets the module manager.
	 * @returns The module manager.
	 */
	public getModuleManager(): ModuleManager {
		return this.moduleManager;
	}

	/**
	 * Gets the storage.
	 * @returns The storage.
	 */
	public getStorage(): PropertyStorage {
		return this.storage;
	}
}
