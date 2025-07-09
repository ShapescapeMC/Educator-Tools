import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { Team } from "../teams/interfaces/team.interface";
import { SceneContext } from "../scene_manager/scene-context";
import { ModuleManager } from "../../module-manager";
import { FocusModeService } from "./focus_mode.service";

export class FocusModeScene extends ActionUIScene {
	public static readonly id = "focus_mode";
	private focusModeService: FocusModeService;

	constructor(sceneManager: SceneManager, context: SceneContext) {
		// Create the scene
		super(FocusModeScene.id, context.getSourcePlayer());
		this.context = context;

		// Get the gamemode service
		this.focusModeService =
			ModuleManager.getInstance().getModule<FocusModeService>(
				FocusModeService.id,
			)!;

		this.setRawBody([
			{
				translate: "edu_tools.ui.focus_mode.body",
			},
		]);

		this.addDivider();

		this.addButton(
			"edu_tools.ui.focus_mode.buttons.global_disable",
			(): void => {
				this.focusModeService.globalDisableFocusMode();
			},
			"textures/edu_tools/ui/icons/focus_mode/global_disable",
		);

		this.addButton(
			"edu_tools.ui.focus_mode.buttons.select_team",
			(): void => {
				context.setSubjectTeamRequired(true);
				context.setNextScene("focus_mode_manage");
				sceneManager.openSceneWithContext(context, "team_select", true);
			},
			"textures/edu_tools/ui/icons/focus_mode/select_team",
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
