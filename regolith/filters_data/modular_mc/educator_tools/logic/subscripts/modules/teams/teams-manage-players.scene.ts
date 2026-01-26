import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { Team } from "./interfaces/team.interface";
import { TeamsService } from "./teams.service";

export class TeamsManagePlayersScene extends ActionUIScene {
	static readonly id = "teams_manage_players";

	constructor(sceneManager: SceneManager, context: SceneContext) {
		super(TeamsManagePlayersScene.id, context.getSourcePlayer());

		this.setContext(context);
		this.setRawBody([
			{ translate: "edu_tools.ui.teams_manage_players.body.1" },
			{ text: " §9" },
			{ text: context.getSubjectTeam()!.name },
			{ text: " §r" },
			{ translate: "edu_tools.ui.teams_manage_players.body.2" },
		]);
		const subjectTeam = context.getSubjectTeam()!;
		const sourcePlayer = context.getSourcePlayer();

		this.addButton(
			"edu_tools.ui.teams_manage_players.buttons.add_player",
			(): void => {
				context.setNextScene("teams_edit_players_apply");
				context.setData("action", "add");
				context.setTargetTeamRequired(true);
				context.setData(
					"team_filter",
					(team: Team, teamsService: TeamsService): boolean => {
						if (teamsService.isPlayerTeam(team.id)) {
							const playerId = team.memberIds[0];
							return !subjectTeam.memberIds.includes(playerId);
						}
						return false;
					},
				);
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/teams_management/add_player",
		);

		this.addButton(
			"edu_tools.ui.teams_manage_players.buttons.remove_player",
			(): void => {
				context.setNextScene("teams_edit_players_apply");
				context.setData("action", "remove");
				context.setTargetTeamRequired(true);
				context.setData(
					"team_filter",
					(team: Team, teamsService: TeamsService): boolean => {
						if (teamsService.isPlayerTeam(team.id)) {
							const playerId = team.memberIds[0];
							if (
								subjectTeam.id === TeamsService.TEACHERS_TEAM_ID &&
								sourcePlayer.id === playerId
							) {
								return false;
							}
							return subjectTeam.memberIds.includes(playerId);
						}
						return false;
					},
				);
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/teams_management/remove_player",
		);
		this.addButton(
			"edu_tools.ui.buttons.back",
			(): void => {
				sceneManager.goBackToScene(context, "teams_management");
			},
			"textures/edu_tools/ui/icons/_general/back",
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
