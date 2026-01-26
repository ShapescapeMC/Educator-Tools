import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { MessageUIScene } from "../scene_manager/ui-scene";
import { TeamsService } from "./teams.service";

export class TeamsDeleteScene extends MessageUIScene {
	static readonly id = "team_delete";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		teamsService: TeamsService,
	) {
		super(TeamsDeleteScene.id, context.getSourcePlayer());

		this.setContext(context);
		const subjectTeam = context.getSubjectTeam()!;
		this.setSimpleBody("edu_tools.ui.teams_delete.body");

		this.setButton1("edu_tools.ui.teams_delete.buttons.delete", (): void => {
			teamsService.deleteTeam(subjectTeam.id);
		});
		this.setButton2("edu_tools.ui.teams_delete.buttons.cancel", (): void => {});

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
