import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { MessageUIScene } from "../scene_manager/ui-scene";
import { LockPlayerService } from "./lock_player.service";

export class LockPlayerConfirmScene extends MessageUIScene {
	static readonly id = "lock_player_confirm";
	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private readonly lockPlayerService: LockPlayerService,
	) {
		super(LockPlayerConfirmScene.id, context.getSourcePlayer());
		this.setContext(context);

		const subjectTeam = context.getSubjectTeam()!;

		this.setRawBody([
			{
				translate: "edu_tools.ui.lock_player_confirm.team.body.1",
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
				translate: "edu_tools.ui.lock_player_confirm.team.body.2",
			},
		]);

		this.setButton1(
			"edu_tools.ui.lock_player_confirm.buttons.confirm",
			(): void => {
				this.lockPlayerService.confirmAction(context);
				sceneManager.openSceneWithContext(
					context,
					"lock_player_team_settings",
					true,
				);
			},
		);
		this.setButton2(
			"edu_tools.ui.lock_player_confirm.buttons.cancel",
			(): void => {},
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
