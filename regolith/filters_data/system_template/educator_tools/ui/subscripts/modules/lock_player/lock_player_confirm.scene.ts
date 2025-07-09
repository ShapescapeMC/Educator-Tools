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
		const targetTeam = context.getTargetTeam()!;

		this.setRawBody([
			{
				translate: "edu_tools.ui.lock_player.team.body",
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
				translate: "edu_tools.ui.lock_player.team.body2",
			},
		]);

		this.setButton1("edu_tools.ui.lock_player.buttons.confirm", (): void => {
			this.lockPlayerService.confirmAction(context);
		});
		this.setButton2("edu_tools.ui.lock_player.buttons.cancel", (): void => {});
	}
}
