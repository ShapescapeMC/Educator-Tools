import { Player, world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { InventoryManageService } from "./inventory-manage.service";
import { Team } from "../teams/interfaces/team.interface";
import { TeamsService } from "../teams/teams.service";

export class InventoryManageScene extends ActionUIScene {
	static readonly id = "inventory_manage";

	constructor(sceneManager: SceneManager, context: SceneContext) {
		super(InventoryManageScene.id, context.getSourcePlayer());

		// Dynamically add toggles for all game rules
		this.setRawBody([
			{
				translate: "edu_tools.ui.inventory_manage.body",
			},
		]);

		this.addButton(
			"edu_tools.ui.inventory_manage.buttons.copy_inventory",
			(): void => {
				context.setSubjectTeamRequired(true);
				context.setTargetTeamRequired(true);
				context.setNextScene("copy_inventory");
				context.setData(
					"team_filter_subject",
					(team: Team, teamsService: TeamsService): boolean => {
						if (!teamsService.isPlayerTeam(team.id)) {
							return false;
						}
						for (const memberId of team.memberIds) {
							const player = world.getEntity(memberId) as Player;
							if (!!player) return true; // Include teams with at least one online player
						}
						return false;
					},
				);
				context.setData(
					"team_filter_target",
					(team: Team, teamsService: TeamsService): boolean => {
						for (const memberId of team.memberIds) {
							const player = world.getEntity(memberId) as Player;
							if (!!player) return true; // Include teams with at least one online player
						}
						return false;
					},
				);
				context.setData("body_key", "inventory_manage.copy_inventory");
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/inventory_manage/copy_inventory",
		);

		this.addButton(
			"edu_tools.ui.inventory_manage.buttons.copy_hotbar",
			(): void => {
				context.setSubjectTeamRequired(true);
				context.setTargetTeamRequired(true);
				context.setNextScene("copy_hotbar");
				context.setData(
					"team_filter_subject",
					(team: Team, teamsService: TeamsService): boolean => {
						if (!teamsService.isPlayerTeam(team.id)) {
							return false;
						}
						for (const memberId of team.memberIds) {
							const player = world.getEntity(memberId) as Player;
							if (!!player) return true; // Include teams with at least one online player
						}
						return false;
					},
				);
				context.setData(
					"team_filter_target",
					(team: Team, teamsService: TeamsService): boolean => {
						for (const memberId of team.memberIds) {
							const player = world.getEntity(memberId) as Player;
							if (!!player) return true; // Include teams with at least one online player
						}
						return false;
					},
				);
				context.setData("body_key", "inventory_manage.copy_hotbar");
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/inventory_manage/copy_hotbar",
		);

		this.addButton(
			"edu_tools.ui.inventory_manage.buttons.copy_item",
			(): void => {
				context.setSubjectTeamRequired(true);
				context.setTargetTeamRequired(true);
				context.setNextScene("copy_item");
				context.setData(
					"team_filter_subject",
					(team: Team, teamsService: TeamsService): boolean => {
						if (!teamsService.isPlayerTeam(team.id)) {
							return false;
						}
						for (const memberId of team.memberIds) {
							const player = world.getEntity(memberId) as Player;
							if (!!player) return true; // Include teams with at least one online player
						}
						return false;
					},
				);
				context.setData(
					"team_filter_target",
					(team: Team, teamsService: TeamsService): boolean => {
						for (const memberId of team.memberIds) {
							const player = world.getEntity(memberId) as Player;
							if (!!player) return true; // Include teams with at least one online player
						}
						return false;
					},
				);
				context.setData("body_key", "inventory_manage.copy_item");
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/inventory_manage/copy_item",
		);

		this.addButton(
			"edu_tools.ui.inventory_manage.buttons.clear_inventory",
			(): void => {
				context.setSubjectTeamRequired(true);
				context.setNextScene("clear_inventory");
				context.setData(
					"team_filter",
					(team: Team, teamsService: TeamsService): boolean => {
						if (!teamsService.isPlayerTeam(team.id)) {
							return false;
						}
						for (const memberId of team.memberIds) {
							const player = world.getEntity(memberId) as Player;
							if (!!player) return true; // Include teams with at least one online player
						}
						return false;
					},
				);
				context.setData("body_key", "inventory_manage.clear_inventory");
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/inventory_manage/clear_inventory",
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
