import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
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

		this.setRawBody([
			{ translate: "edu_tools.ui.player_nickname_teacher.body" },
			settings.nicknamesEnabled
				? {}
				: {
						text: "\n",
				  },
			settings.nicknamesEnabled
				? {}
				: {
						translate: "edu_tools.ui.player_nickname_teacher.warning_disabled",
				  },
		]);

		if (settings.requireApproval && settings.nicknamesEnabled) {
			let requestCount =
				playerNicknameService.getNicknameApprovalRequests().length;
			let requestCountString = "" + requestCount;
			if (requestCount > 0) {
				requestCountString = "§c" + requestCount + "§r";
			}
			if (requestCount > 99) {
				requestCountString = "§c99+§r";
			}
			this.addButton(
				{
					translate: "edu_tools.ui.player_nickname_teacher.approval_queue",
					with: [requestCountString],
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

		if (settings.nicknamesEnabled) {
			this.addButton(
				{ translate: "edu_tools.ui.player_nickname_teacher.list" },
				() => {
					sceneManager.openSceneWithContext(
						context,
						"player_nickname_edit_selector",
						false,
					);
				},
				"textures/edu_tools/ui/icons/player_nickname/list",
			);
		}

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
