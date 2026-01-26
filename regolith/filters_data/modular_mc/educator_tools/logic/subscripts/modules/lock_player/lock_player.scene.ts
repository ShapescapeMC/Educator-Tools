import { Player, world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene, ModalUIScene } from "../scene_manager/ui-scene";
import { Team } from "../teams/interfaces/team.interface";
import { LockPlayerService } from "./lock_player.service";

export class LockPlayerScene extends ActionUIScene {
	static readonly id = "lock_player";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		lockPlayerService: LockPlayerService,
	) {
		super(LockPlayerScene.id, context.getSourcePlayer());

		this.setContext(context);
		this.setSimpleBody("edu_tools.ui.lock_player.body");

		this.addButton(
			"edu_tools.ui.lock_player.buttons.add_team_lock",
			(): void => {
				context.setNextScene("lock_player_team");
				context.setSubjectTeamRequired(true);
				context.setData("team_filter", (team: Team): boolean => {
					for (const memberId of team.memberIds) {
						const isPlayerExempted =
							lockPlayerService.isPlayerExempted(memberId);
						if (!isPlayerExempted) {
							return true;
						}
					}
					return false;
				});
				//context.setData("isCreationMode", true);
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/lock_player/add_team_lock",
		);
		this.addButton(
			"edu_tools.ui.lock_player.buttons.view_teams",
			(): void => {
				context.setNextScene("lock_player_team_settings");
				context.setSubjectTeamRequired(true);
				context.setData("team_filter", (team: Team): boolean => {
					return !!lockPlayerService.getLockSettings(team.id);
				});
				//context.setData("isCreationMode", false);
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/lock_player/view_teams",
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
