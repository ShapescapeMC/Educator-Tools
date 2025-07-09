import { world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { LockPlayerService } from "./lock_player.service";
import { Team } from "../teams/interfaces/team.interface";
import { TeamsService } from "../teams/teams.service";

export class LockPlayerTeamScene extends ModalUIScene {
	static readonly id = "lock_player_team";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		lockPlayerService: LockPlayerService,
	) {
		super(LockPlayerTeamScene.id, context.getSourcePlayer(), "team_select");

		this.setContext(context);

		this.setTitle("edu_tools.ui.lock_player_team.title");
		const subjectTeam = context.getSubjectTeam()!;
		this.addLabel({
			rawtext: [
				{
					translate: "edu_tools.ui.lock_player.team.body",
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
					translate: "edu_tools.ui.lock_player.team.body2",
				},
			],
		});
		this.addLabel(subjectTeam.name);

		this.addSlider(
			"edu_tools.ui.lock_player_team.radius",
			5,
			100,
			(value: number) => {
				context.setData("radius", value);
			},
			{
				defaultValue: 10,
				valueStep: 5,
				tooltip: "edu_tools.ui.lock_player_team.radius_tooltip",
			},
		);
		this.addToggle(
			"edu_tools.ui.lock_player_team.teleport_to_center",
			(value: boolean) => {
				context.setData("teleportToCenter", value);
			},
			{
				defaultValue: true,
				tooltip: "edu_tools.ui.lock_player_team.teleport_to_center_tooltip",
			},
		);

		this.addToggle(
			"edu_tools.ui.lock_player_team.show_boundaries",
			(value: boolean) => {
				context.setData("showBoundaries", value);
			},
			{
				defaultValue: true,
				tooltip: "edu_tools.ui.lock_player_team.show_boundaries_tooltip",
			},
		);

		this.addToggle(
			"edu_tools.ui.lock_player_team.show_lock_message",
			(value: boolean) => {
				context.setData("showLockMessage", value);
			},
			{
				defaultValue: true,
				tooltip: "edu_tools.ui.lock_player_team.show_lock_message_tooltip",
			},
		);

		this.addDropdown(
			"edu_tools.ui.lock_player_team.mode",
			["center", "player"],
			(value: string) => {
				context.setData("mode", value);
			},
			{
				defaultValueIndex: 0,
				tooltip: "edu_tools.ui.lock_player_team.mode_tooltip",
			},
		);

		const isCreationMode = context.getData("isCreationMode") || false;
		if (isCreationMode) {
			context.setNextScene("lock_player_confirm");
			context.setTargetTeamRequired(true);
			context.setData(
				"team_filter",
				(team: Team, teamsService: TeamsService): boolean => {
					// Only online teams with a single member are valid
					if (
						teamsService.isPlayerTeam(team.id) &&
						world.getEntity(team.memberIds[0])
					) {
						return true;
					}
					return false;
				},
			);
		}

		const response = this.show(context.getSourcePlayer(), sceneManager);
		if (!isCreationMode) {
			response.then(() => {
				lockPlayerService.confirmAction(context);
			});
		}
	}
}
