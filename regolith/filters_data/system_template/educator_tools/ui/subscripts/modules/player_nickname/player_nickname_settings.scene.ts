import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { PlayerNicknameService } from "./player_nickname.service";

export class PlayerNicknameSettingsScene extends ModalUIScene {
	static readonly id = "player_nickname_Settings";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private readonly playerNicknameService: PlayerNicknameService,
	) {
		super(PlayerNicknameSettingsScene.id, context.getSourcePlayer());
		this.setContext(context);

		const settings = this.playerNicknameService.getSettings();

		this.addLabel({ translate: "edu_tools.ui.player_nickname_student.body" });

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

		const response = this.show(context.getSourcePlayer(), sceneManager);
		response.then((r) => {
			if (r.canceled) {
				return;
			}

			const promptOnJoin = context.getData("promptOnJoin") as boolean;
			const allowCustomColors = context.getData("allowCustomColors") as boolean;

			this.playerNicknameService.updateSettings({
				promptOnJoin,
				allowCustomColors,
			});
		});
	}
}
