import { world, Player } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { Team } from "../teams/interfaces/team.interface";
import { TeamsService } from "../teams/teams.service";
import { PlayerNicknameService } from "./player_nickname.service";

export class PlayerNicknameTeacherScene extends ActionUIScene {
	static readonly id = "player_nickname_teacher";
	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		playerNicknameService: PlayerNicknameService,
	) {
		super(PlayerNicknameTeacherScene.id, context.getSourcePlayer());
		this.setContext(context);

		const settings = playerNicknameService.getSettings();

		this.addLabel({ translate: "edu_tools.ui.player_nickname_teacher.body" });

		if (settings.requireApproval) {
			this.addButton(
				{
					translate: "edu_tools.ui.player_nickname_teacher.approval_queue",
					with: [
						playerNicknameService.getNicknameApprovalRequests().length + "",
					],
				},
				() => {
					sceneManager.openSceneWithContext(
						context,
						"player_nickname_approval",
						true,
					);
				},
				"textures/edu_tools/ui/icons/player_nickname/approval_queue",
			);
		}

		this.addButton(
			{ translate: "edu_tools.ui.player_nickname_teacher.settings" },
			() => {
				sceneManager.openSceneWithContext(
					context,
					"player_nickname_settings",
					true,
				);
			},
			"textures/edu_tools/ui/icons/player_nickname/settings",
		);

		this.addButton(
			{ translate: "edu_tools.ui.player_nickname_teacher.list" },
			() => {
				context.setSubjectTeamRequired(true);
				context.setNextScene("player_nickname_edit");
				context.setData(
					"team_filter_subject",
					(team: Team, teamsService: TeamsService): boolean => {
						if (!teamsService.isPlayerTeam(team.id)) {
							return false;
						}
						for (const memberId of team.memberIds) {
							const player = world.getEntity(memberId) as Player;
							if (!!player || playerNicknameService.getNickname(memberId))
								return true; // Include teams with at least one online player or a nickname set
						}
						return false;
					},
				);
				context.setData("body_key", "player_nickname_teacher.select_student");
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/player_nickname/list",
		);

		this.addButton(
			"edu_tools.ui.buttons.back",
			() => {
				sceneManager.goBackToScene(context, "main");
			},
			"textures/edu_tools/ui/icons/_general/back",
		);
	}
}
