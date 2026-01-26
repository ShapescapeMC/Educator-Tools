import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { SceneContext } from "../scene_manager/scene-context";
import { ModuleManager } from "../../module-manager";
import { ManageHealthService } from "./manage_health.service";

export class ManageHealthSettingsScene extends ModalUIScene {
	public static readonly id = "manage_health_settings";
	private manageHealthService: ManageHealthService;

	constructor(sceneManager: SceneManager, context: SceneContext) {
		// Create the scene
		super(
			ManageHealthSettingsScene.id,
			context.getSourcePlayer(),
			"manage_health",
		);
		this.context = context;

		// Get the gamemode service
		this.manageHealthService =
			ModuleManager.getInstance().getModule<ManageHealthService>(
				ManageHealthService.id,
			)!;

		// Get the target team
		const subjectTeam = context.getSubjectTeam()!;
		const properties =
			this.manageHealthService.getTeamHealthProperties(subjectTeam);
		this.addToggle(
			"edu_tools.ui.manage_health.settings.health",
			(value: boolean): void => {
				this.manageHealthService.setTeamHealthProperties(subjectTeam, {
					health: value,
				});
			},
			{
				defaultValue: properties.health,
				tooltip: "edu_tools.ui.manage_health.settings.health_tooltip",
			},
		);
		this.addToggle(
			"edu_tools.ui.manage_health.settings.hunger",
			(value: boolean): void => {
				this.manageHealthService.setTeamHealthProperties(subjectTeam, {
					hunger: value,
				});
			},
			{
				defaultValue: properties.hunger,
				tooltip: "edu_tools.ui.manage_health.settings.hunger_tooltip",
			},
		);
		this.addToggle(
			"edu_tools.ui.manage_health.settings.effect_immunity",
			(value: boolean): void => {
				this.manageHealthService.setTeamHealthProperties(subjectTeam, {
					effect_immunity: value,
				});
			},
			{
				defaultValue: properties.effect_immunity,
				tooltip: "edu_tools.ui.manage_health.settings.effect_immunity_tooltip",
			},
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
