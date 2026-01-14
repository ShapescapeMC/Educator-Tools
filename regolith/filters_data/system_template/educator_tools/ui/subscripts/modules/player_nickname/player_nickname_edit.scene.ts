import { Player, world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { TeamsService } from "../teams/teams.service";
import { ColorCode, PlayerNicknameService } from "./player_nickname.service";

export class PlayerNicknameEditScene extends ModalUIScene {
	static readonly id = "player_nickname_edit";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private readonly playerNicknameService: PlayerNicknameService,
		private readonly teamsService: TeamsService,
	) {
		super(PlayerNicknameEditScene.id, context.getSourcePlayer());
		this.setContext(context);
		const subjectTeam = context.getSubjectTeam()!;
		if (!this.teamsService.isPlayerTeam(subjectTeam.id)) {
			throw new Error(
				"PlayerNicknameEditScene can only be opened for player teams",
			);
		}
		const playerId = subjectTeam.memberIds[0];

		const currentNickname = this.playerNicknameService.getNickname(playerId);
		const player = world.getEntity(playerId) as Player | undefined;

		this.addLabel({ translate: "edu_tools.ui.player_nickname_edit.body" });

		this.addTextField(
			{ translate: "edu_tools.ui.player_nickname_edit.nickname" },
			currentNickname ? currentNickname : player?.name ?? "",
			(value: string) => {
				context.setData("nickname", value);
			},
			{
				tooltip: "edu_tools.ui.player_nickname_edit.nickname_tooltip",
			},
		);
		// Turn ColorCode enum into dropdown options using keys
		const options: string[] = [];
		for (const key in ColorCode) {
			options.push(`edu_tools.ui.palette_color.${key.toLowerCase()}`);
		}
		this.addDropdown(
			{ translate: "edu_tools.ui.player_nickname_edit.color" },
			options,
			(value: string) => {
				context.setData("colorIndex", value);
			},
			{
				defaultValueIndex: options.indexOf("edu_tools.ui.palette_color.white"),
				tooltip: "edu_tools.ui.player_nickname_edit.color_tooltip",
			},
		);

		const response = this.show(context.getSourcePlayer(), sceneManager);
		response.then((r) => {
			if (r.canceled) {
				return;
			}
			const nickname = context.getData("nickname") as string;
			const colorIndex = context.getData("colorIndex") as number | 0;
			let colorCode = Object.values(ColorCode)[colorIndex];
			if (nickname && nickname.trim().length > 0) {
				const newNickname = colorCode + nickname.trim();
				this.playerNicknameService.setNickname(playerId, newNickname);
			} else {
				this.playerNicknameService.clearNickname(playerId);
			}
		});
	}
}
