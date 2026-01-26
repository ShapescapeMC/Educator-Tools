import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene, ModalUIScene } from "../scene_manager/ui-scene";
import { Team } from "../teams/interfaces/team.interface";
import { SceneContext } from "../scene_manager/scene-context";
import { ModuleManager } from "../../module-manager";
import { FocusModeService } from "./focus_mode.service";

export class FocusModeManageScene extends ModalUIScene {
	public static readonly id = "focus_mode_manage";
	private focusModeService: FocusModeService;

	constructor(sceneManager: SceneManager, context: SceneContext) {
		// Create the scene
		super(FocusModeManageScene.id, context.getSourcePlayer(), "");
		this.context = context;

		// Get the gamemode service
		this.focusModeService =
			ModuleManager.getInstance().getModule<FocusModeService>(
				FocusModeService.id,
			)!;

		const subjectTeam = context.getSubjectTeam()!;
		const isFocusModeEnabled =
			this.focusModeService.getTeamFocusMode(subjectTeam);

		this.addLabel({
			rawtext: [
				{
					translate: "edu_tools.ui.focus_mode_manage.body.1",
				},
				{
					text: " §9",
				},
				{
					text: subjectTeam.name,
				},
				{
					text: " §r",
				},
				{
					translate: "edu_tools.ui.focus_mode_manage.body.2",
				},
			],
		});

		this.addToggle(
			"edu_tools.ui.focus_mode_manage.toggle.enable",
			(value) => {
				this.focusModeService.setTeamFocusMode(subjectTeam, value);
			},
			{
				defaultValue: isFocusModeEnabled,
				tooltip: "edu_tools.ui.focus_mode_manage.toggle.enable_tooltip",
			},
		);

		let message = this.focusModeService.getTeamsFocusModeMessage(subjectTeam);
		if (message && typeof message !== "string") {
			message = message + "";
		}

		this.addTextField(
			"edu_tools.ui.focus_mode_manage.text_field.message",
			"edu_tools.ui.focus_mode_manage.text_field.message_placeholder",
			(value) => {
				this.focusModeService.setTeamsFocusModeMessage(subjectTeam, value);
			},
			{
				defaultValue: message,
				tooltip: "edu_tools.ui.focus_mode_manage.text_field.message_tooltip",
			},
		);

		this.show(context.getSourcePlayer(), sceneManager).then((r) => {
			if (r.canceled) return;
			this.player.sendMessage({
				translate: "edu_tools.message.focus_mode.settings_updated",
			});
		});
	}
}
