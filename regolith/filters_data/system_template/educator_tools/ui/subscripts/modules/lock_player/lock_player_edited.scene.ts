import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { LockPlayerService } from "./lock_player.service";

export class LockPlayerConfirmScene extends ActionUIScene {
	static readonly id = "lock_player_edited";
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
				translate: "edu_tools.ui.lock_player_edited.team.body.1",
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
				translate: "edu_tools.ui.lock_player_edited.team.body.2",
			},
		]);

		

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
