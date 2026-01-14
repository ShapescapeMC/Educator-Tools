import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { TeamsService } from "../teams/teams.service";
import { ColorCode, PlayerNicknameService } from "./player_nickname.service";

export class PlayerNicknameStudentScene extends ModalUIScene {
	static readonly id = "player_nickname_student";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private readonly playerNicknameService: PlayerNicknameService,
		private readonly teamsService: TeamsService,
	) {
		super(PlayerNicknameStudentScene.id, context.getSourcePlayer());
		this.setContext(context);

		this.playerNicknameService
			.getPlayerNicknameMechanic()
			.studentUIOpened(context.getSourcePlayer().id);

		const currentNickname = this.playerNicknameService.getNickname(
			context.getSourcePlayer().id,
		);

		const settings = this.playerNicknameService.getSettings();

		this.addLabel({ translate: "edu_tools.ui.player_nickname_student.body" });

		this.addTextField(
			{ translate: "edu_tools.ui.player_nickname_student.nickname" },
			currentNickname ? currentNickname : this.player.name,
			(value: string) => {
				context.setData("nickname", value);
			},
			{
				tooltip: "edu_tools.ui.player_nickname_student.nickname_tooltip",
			},
		);

		if (
			settings.allowCustomColors ||
			this.teamsService!.isPlayerInTeam(
				TeamsService.TEACHERS_TEAM_ID,
				context.getSourcePlayer().id,
			)
		) {
			// Turn ColorCode enum into dropdown options using keys
			const options: string[] = [];
			for (const key in ColorCode) {
				options.push(`edu_tools.ui.palette_color.${key.toLowerCase()}`);
			}
			this.addDropdown(
				{ translate: "edu_tools.ui.player_nickname_student.color" },
				options,
				(value: string) => {
					context.setData("colorIndex", value);
				},
				{
					defaultValueIndex: options.indexOf(
						"edu_tools.ui.palette_color.white",
					),
					tooltip: "edu_tools.ui.player_nickname_student.color_tooltip",
				},
			);
		}

		const response = this.show(context.getSourcePlayer(), sceneManager);
		response.then((r) => {
			if (r.canceled) {
				return;
			}
			const nickname = context.getData("nickname") as string;
			const colorIndex = context.getData("colorIndex") as number | 0;
			let colorCode = settings.allowCustomColors
				? Object.values(ColorCode)[colorIndex]
				: "";
			if (nickname && nickname.trim().length > 0) {
				const newNickname = colorCode + nickname.trim();
				if (
					settings.requireApproval &&
					!this.teamsService!.isPlayerInTeam(
						TeamsService.TEACHERS_TEAM_ID,
						context.getSourcePlayer().id,
					)
				) {
					this.playerNicknameService.addNicknameApprovalRequest(
						context.getSourcePlayer().id,
						newNickname,
					);
				} else {
					this.playerNicknameService.setNickname(
						context.getSourcePlayer().id,
						newNickname,
					);
				}
			} else {
				this.playerNicknameService.clearNickname(context.getSourcePlayer().id);
			}
		});
	}
}
