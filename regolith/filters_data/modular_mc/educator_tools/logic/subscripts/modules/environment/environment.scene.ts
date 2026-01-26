import { SceneContext } from "../scene_manager/scene-context.ts";
import { SceneManager } from "../scene_manager/scene-manager.ts";
import { ActionUIScene } from "../scene_manager/ui-scene.ts";
import { EnvironmentService } from "./environment.service.ts";

/**
 * Main environment settings scene that provides access to daytime, weather, and quick actions.
 * Displays buttons for navigating to specific environment settings and applying preset configurations.
 */
export class EnvironmentScene extends ActionUIScene {
	static readonly id = "environment";

	/**
	 * Creates a new EnvironmentScene with navigation to daytime, weather, and preset options.
	 * @param sceneManager - The scene manager for handling scene navigation
	 * @param context - The scene context containing player and navigation history
	 * @param environmentService - The environment service for managing world settings
	 */
	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		environmentService: EnvironmentService,
	) {
		super(EnvironmentScene.id, context.getSourcePlayer());

		this.setContext(context);
		this.setSimpleBody("edu_tools.ui.environment.body");

		this.addButton(
			"edu_tools.ui.environment.buttons.daytime_settings",
			(): void => {
				sceneManager.openSceneWithContext(context, "environment_daytime", true);
			},
			"textures/edu_tools/ui/icons/environment/daytime_settings",
		);

		this.addButton(
			"edu_tools.ui.environment.buttons.weather_settings",
			(): void => {
				sceneManager.openSceneWithContext(context, "environment_weather", true);
			},
			"textures/edu_tools/ui/icons/environment/weather_settings",
		);

		this.addButton(
			"edu_tools.ui.environment.buttons.always_day",
			(): void => {
				environmentService.alwaysDay();
				this.player.sendMessage("edu_tools.message.environment.always_day_set");
				sceneManager.openSceneWithContext(context, "environment", false);
			},
			"textures/edu_tools/ui/icons/environment/always_day",
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
