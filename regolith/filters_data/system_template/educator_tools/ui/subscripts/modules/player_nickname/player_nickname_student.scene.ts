import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { PlayerNicknameService } from "./player_nickname.service";

export class PlayerNicknameStudentScene extends ModalUIScene {
	static readonly id = "player_nickname_student";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private readonly playerNicknameService: PlayerNicknameService,
	) {
		super(PlayerNicknameStudentScene.id, context.getSourcePlayer());
		this.setContext(context);

		const currentNickname = this.playerNicknameService.getNickname(
			context.getSourcePlayer().id,
		);

		this.addLabel({ translate: "edu_tools.ui.player_nickname_student.body" });

		this.addTextField(
			{ translate: "edu_tools.ui.player_nickname_student.nickname" },
			currentNickname ? currentNickname : "John",
			(value: string) => {
				context.setData("nickname", value);
			},
			{
				tooltip: "edu_tools.ui.player_nickname_student.nickname_tooltip",
			},
		);

		const response = this.show(context.getSourcePlayer(), sceneManager);
		response.then((r) => {
			if (r.canceled) {
				return;
			}
			const nickname = context.getData("nickname") as string;
			if (nickname && nickname.trim().length > 0) {
				this.playerNicknameService.setNickname(
					context.getSourcePlayer().id,
					nickname.trim(),
				);
			} else {
				this.playerNicknameService.clearNickname(context.getSourcePlayer().id);
			}
		});
	}
}
