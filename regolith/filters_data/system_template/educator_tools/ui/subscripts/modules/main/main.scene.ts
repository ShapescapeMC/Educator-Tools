import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { SceneContext } from "../scene_manager/scene-context";
import { MainService } from "./main.service";

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

		// Show the UI to the source player
		this.show(context.getSourcePlayer(), sceneManager);
	}
}
/* 
this.setSimpleBody("edu_tools.ui.main.body");
		this.addButton(
			"edu_tools.ui.main.buttons.teleport",
			(): void => {
				context.setSubjectTeamRequired(true);
				context.setTargetTeamRequired(true);
				context.setNextScene("teleport");
				sceneManager.openSceneWithContext(context, "team_select");
			},
			"textures/edu_tools/ui/icons/main/teleport",
		);
		this.addButton(
			"edu_tools.ui.main.buttons.gamemode",
			(): void => {
				context.setSubjectTeamRequired(true);
				context.setNextScene("set_gamemode");
				sceneManager.openSceneWithContext(context, "team_select");
			},
			"textures/edu_tools/ui/icons/main/gamemode",
		);
		this.addButton(
			"edu_tools.ui.main.buttons.timer",
			(): void => {
				sceneManager.openSceneWithContext(context, "timer");
			},
			"textures/edu_tools/ui/icons/main/timer",
		);
		this.addButton(
			"edu_tools.ui.main.buttons.world_settings",
			(): void => {
				sceneManager.openSceneWithContext(context, "world_settings");
			},
			"textures/edu_tools/ui/icons/main/world_settings",
		);
		this.addButton(
			"edu_tools.ui.main.buttons.lock_players",
			(): void => {
				sceneManager.openSceneWithContext(context, "lock_players");
			},
			"textures/edu_tools/ui/icons/main/lock_players",
		);
		this.addButton(
			"edu_tools.ui.main.buttons.copy_inventory",
			(): void => {
				sceneManager.openScene("set_players", "copy_inventory");
			},
			"textures/edu_tools/ui/icons/main/copy_inventory",
		);
		this.addButton(
			"edu_tools.ui.main.buttons.manage_health",
			(): void => {
				sceneManager.openScene("set_players", "manage_health");
			},
			"textures/edu_tools/ui/icons/main/manage_health",
		);
		this.addButton(
			"edu_tools.ui.buttons.exit",
			(): void => {},
			"textures/edu_tools/ui/icons/_general/exit",
		);
*/
