import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { Team } from "./interfaces/team.interface";

export class TeamsManagementScene extends ActionUIScene {
	static readonly id = "teams_management";

	constructor(sceneManager: SceneManager, context: SceneContext) {
		super(TeamsManagementScene.id, context.getSourcePlayer());

		this.setContext(context);
		this.setSimpleBody("edu_tools.ui.teams_management.body");

		this.addButton(
			"edu_tools.ui.teams_management.buttons.create_team",
			(): void => {
				sceneManager.openSceneWithContext(context, "teams_edit", true);
			},
			"textures/edu_tools/ui/icons/teams/create_team",
		);

		this.addButton(
			"edu_tools.ui.teams_management.buttons.edit_team",
			(): void => {
				context.setNextScene("teams_edit");
				context.setSubjectTeamRequired(true);
				context.setData("team_filter", (team: Team): boolean => {
					return !!team.editable;
				});
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/teams/edit_team",
		);

		this.addButton(
			"edu_tools.ui.teams_management.buttons.delete_team",
			(): void => {
				context.setNextScene("team_delete");
				context.setSubjectTeamRequired(true);
				context.setData("team_filter", (team: Team): boolean => {
					return !!team.editable && !team.isSystem;
				});
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/teams/delete_team",
		);

		this.addButton(
			"edu_tools.ui.teams_management.buttons.manage_players",
			(): void => {
				context.setNextScene("manage_players");
				context.setSubjectTeamRequired(true);
				context.setData("team_filter", (team: Team): boolean => {
					return !!team.editable;
				});
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/teams/manage_players",
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
