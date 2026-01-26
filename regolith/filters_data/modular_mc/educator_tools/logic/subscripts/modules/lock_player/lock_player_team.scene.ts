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
		super(LockPlayerTeamScene.id, context.getSourcePlayer());

		this.setContext(context);

		const subjectTeam = context.getSubjectTeam()!;
		this.addLabel({
			rawtext: [
				{
					translate: "edu_tools.ui.lock_player.team.body.1",
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
					translate: "edu_tools.ui.lock_player.team.body.2",
				},
			],
		});
		const currentLock = lockPlayerService.getLockSettings(subjectTeam.id);

		this.addSlider(
			{ translate: "edu_tools.ui.lock_player_team.radius" },
			5,
			150,
			(value: number) => {
				context.setData("radius", value);
			},
			{
				defaultValue: currentLock?.radius || 16,
				valueStep: 1,
				tooltip: "edu_tools.ui.lock_player_team.radius_tooltip",
			},
		);
		this.addToggle(
			"edu_tools.ui.lock_player_team.teleport_to_center",
			(value: boolean) => {
				context.setData("teleportToCenter", value);
			},
			{
				defaultValue: !!currentLock?.teleportToCenter,
				tooltip: "edu_tools.ui.lock_player_team.teleport_to_center_tooltip",
			},
		);

		this.addToggle(
			"edu_tools.ui.lock_player_team.show_boundaries",
			(value: boolean) => {
				context.setData("showBoundaries", value);
			},
			{
				// True by default, unless shownBoundaries is set to false in the current lock
				defaultValue: currentLock?.showBoundaries !== false,
				tooltip: "edu_tools.ui.lock_player_team.show_boundaries_tooltip",
			},
		);

		this.addToggle(
			"edu_tools.ui.lock_player_team.show_lock_message",
			(value: boolean) => {
				context.setData("showLockMessage", value);
			},
			{
				defaultValue: currentLock?.showLockMessage !== false,
				tooltip: "edu_tools.ui.lock_player_team.show_lock_message_tooltip",
			},
		);

		this.addDropdown(
			"edu_tools.ui.lock_player_team.mode",
			[
				"edu_tools.ui.lock_player_team.mode.options.center",
				"edu_tools.ui.lock_player_team.mode.options.player",
			],
			(value: string) => {
				context.setData("mode", value);
			},
			{
				defaultValueIndex: !!currentLock?.playerBound ? 1 : 0,
				tooltip: "edu_tools.ui.lock_player_team.mode_tooltip",
			},
		);

		if (!currentLock) {
			//context.setNextScene("lock_player_confirm");
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
		response.then((r) => {
			if (r.canceled) {
				return;
			}
			const mode = context.getData("mode") || 0;
			const isPlayerBoundMode = mode === 1;
			const needsTeamSelection =
				isPlayerBoundMode && (!currentLock || !currentLock.playerBound);

			if (needsTeamSelection) {
				this.setupTeamSelection(context, sceneManager);
			} else {
				sceneManager.openSceneWithContext(context, "lock_player_confirm", true);
			}
		});
	}

	private setupTeamSelection(
		context: SceneContext,
		sceneManager: SceneManager,
	): void {
		context.setNextScene("lock_player_confirm");
		context.setTargetTeamRequired(true);
		context.setData("team_filter", this.createTeamFilter());
		sceneManager.openSceneWithContext(context, "team_select", true);
	}

	private createTeamFilter() {
		return (team: Team, teamsService: TeamsService): boolean => {
			// Only online teams with a single member are valid
			return (
				teamsService.isPlayerTeam(team.id) &&
				!!world.getEntity(team.memberIds[0])
			);
		};
	}
}
