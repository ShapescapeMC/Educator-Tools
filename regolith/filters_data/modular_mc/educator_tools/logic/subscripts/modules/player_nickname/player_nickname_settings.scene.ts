import { SceneContext } from "../scene_manager/scene-context.ts";
import { SceneManager } from "../scene_manager/scene-manager.ts";
import { ModalUIScene } from "../scene_manager/ui-scene.ts";
import { PlayerNicknameService } from "./player_nickname.service.ts";

export class PlayerNicknameSettingsScene extends ModalUIScene {
	static readonly id = "player_nickname_settings";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private readonly playerNicknameService: PlayerNicknameService,
	) {
		super(PlayerNicknameSettingsScene.id, context.getSourcePlayer());
		this.setContext(context);

		const settings = this.playerNicknameService.getSettings();

		this.addLabel({ translate: "edu_tools.ui.player_nickname_settings.body" });

		this.addToggle(
			"edu_tools.ui.player_nickname_settings.nicknames_enabled",
			(value: boolean) => {
				context.setData("nicknamesEnabled", value);
			},
			{
				defaultValue: settings.nicknamesEnabled,
				tooltip:
					"edu_tools.ui.player_nickname_settings.nicknames_enabled_tooltip",
			},
		);

		this.addToggle(
			"edu_tools.ui.player_nickname_settings.prompt_on_join",
			(value: boolean) => {
				context.setData("promptOnJoin", value);
			},
			{
				defaultValue: settings.promptOnJoin,
				tooltip: "edu_tools.ui.player_nickname_settings.prompt_on_join_tooltip",
			},
		);

		this.addToggle(
			"edu_tools.ui.player_nickname_settings.allow_custom_colors",
			(value: boolean) => {
				context.setData("allowCustomColors", value);
			},
			{
				defaultValue: settings.allowCustomColors,
				tooltip:
					"edu_tools.ui.player_nickname_settings.allow_custom_colors_tooltip",
			},
		);

		this.addToggle(
			"edu_tools.ui.player_nickname_settings.require_approval",
			(value: boolean) => {
				context.setData("requireApproval", value);
			},
			{
				defaultValue: settings.requireApproval,
				tooltip:
					"edu_tools.ui.player_nickname_settings.require_approval_tooltip",
			},
		);

		this.addToggle(
			"edu_tools.ui.player_nickname_settings.custom_leave_join_messages",
			(value: boolean) => {
				context.setData("customLeaveJoinMessages", value);
			},
			{
				defaultValue: settings.customLeaveJoinMessages,
				tooltip:
					"edu_tools.ui.player_nickname_settings.custom_leave_join_messages_tooltip",
			},
		);

		const response = this.show(context.getSourcePlayer(), sceneManager);
		response.then((r) => {
			if (r.canceled) {
				return;
			}

			const nicknamesEnabled = context.getData("nicknamesEnabled") as boolean;
			const promptOnJoin = context.getData("promptOnJoin") as boolean;
			const allowCustomColors = context.getData("allowCustomColors") as boolean;
			const requireApproval = context.getData("requireApproval") as boolean;
			const customLeaveJoinMessages = context.getData(
				"customLeaveJoinMessages",
			) as boolean;

			this.playerNicknameService.updateSettings({
				nicknamesEnabled,
				promptOnJoin,
				allowCustomColors,
				requireApproval,
				customLeaveJoinMessages,
			});
			sceneManager.goBackToScene(context, "player_nickname_teacher");
		});
	}
}
