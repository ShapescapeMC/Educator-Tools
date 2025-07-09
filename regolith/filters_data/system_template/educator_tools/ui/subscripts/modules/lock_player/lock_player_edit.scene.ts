import { world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { Team } from "../teams/interfaces/team.interface";
import { TeamsService } from "../teams/teams.service";

export class LockPlayerEditScene extends ActionUIScene {
	static readonly id = "lock_player_edit";

	constructor(sceneManager: SceneManager, context: SceneContext) {
		super(LockPlayerEditScene.id, context.getSourcePlayer());

		this.setContext(context);
		this.setSimpleBody("edu_tools.ui.lock_player_edit.body");

		this.addButton(
			"edu_tools.ui.lock_player_edit.buttons.edit_team_lock",
			(): void => {
				sceneManager.openSceneWithContext(
					context,
					"lock_player_edit_team_lock",
					true,
				);
			},
			"textures/edu_tools/ui/icons/lock_player/edit_team_lock",
		);
		this.addButton(
			"edu_tools.ui.lock_player_edit.buttons.set_center",
			(): void => {
				context.setNextScene("lock_player_edited");
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
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/lock_player/set_center",
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
