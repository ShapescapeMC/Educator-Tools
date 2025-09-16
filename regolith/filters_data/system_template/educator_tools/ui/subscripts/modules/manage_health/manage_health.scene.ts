import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { Team } from "../teams/interfaces/team.interface";
import { SceneContext } from "../scene_manager/scene-context";
import { ModuleManager } from "../../module-manager";
import { GameMode } from "@minecraft/server";
import { ManageHealthService } from "./manage_health.service";

export class ManageHealthScene extends ActionUIScene {
	public static readonly id = "manage_health";
	private manageHealthService: ManageHealthService;

	constructor(sceneManager: SceneManager, context: SceneContext) {
		// Create the scene
		super(ManageHealthScene.id, context.getSourcePlayer());
		this.context = context;

		// Get the gamemode service
		this.manageHealthService =
			ModuleManager.getInstance().getModule<ManageHealthService>(
				ManageHealthService.id,
			)!;

		// Get the target team
		const subjectTeam = context.getSubjectTeam()!;

		this.setRawBody([
			{
				translate: "edu_tools.ui.manage_health.team.body.1",
			},
			{
				text: " §9",
			},
			{
				text: subjectTeam.name,
			},
			{
				text: " §r",
			},
			{
				translate: "edu_tools.ui.manage_health.team.body.2",
			},
		]);

		this.addButton(
			"edu_tools.ui.manage_health.buttons.heal",
			(): void => {
				this.manageHealthService.cureTeam(subjectTeam);
				this.player.sendMessage({
					translate: "edu_tools.message.manage_health.team.healed",
					with: [subjectTeam.name],
				});
				sceneManager.openSceneWithContext(context, "manage_health", false);
			},
			"textures/edu_tools/ui/icons/manage_health/heal",
		);
		this.addButton(
			"edu_tools.ui.manage_health.buttons.clear_effects",
			(): void => {
				this.manageHealthService.clearTeamEffects(subjectTeam);
				this.player.sendMessage({
					translate: "edu_tools.message.manage_health.team.cleared_effects",
					with: [subjectTeam.name],
				});
				sceneManager.openSceneWithContext(context, "manage_health", false);
			},
			"textures/edu_tools/ui/icons/manage_health/clear_effects",
		);
		this.addButton(
			"edu_tools.ui.manage_health.buttons.reset",
			(): void => {
				this.manageHealthService.resetProperties(subjectTeam);
				this.player.sendMessage({
					translate: "edu_tools.message.manage_health.team.reset",
					with: [subjectTeam.name],
				});
				sceneManager.openSceneWithContext(context, "manage_health", false);
			},
			"textures/edu_tools/ui/icons/manage_health/reset",
		);
		this.addButton(
			"edu_tools.ui.manage_health.buttons.settings",
			(): void => {
				// Open the settings scene for managing health properties
				sceneManager.openSceneWithContext(
					context,
					"manage_health_settings",
					true,
				);
			},
			"textures/edu_tools/ui/icons/manage_health/settings",
		);

		this.addButton(
			"edu_tools.ui.buttons.back",
			() => {
				sceneManager.goBackToScene(context, "main");
			},
			"textures/edu_tools/ui/icons/_general/back",
		);

		// Pass the context to the scene to handle navigation
		this.setContext(context);
		this.show(context.getSourcePlayer(), sceneManager);
	}
}
