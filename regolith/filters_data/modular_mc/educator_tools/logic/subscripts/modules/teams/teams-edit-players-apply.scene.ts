import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { TeamsService } from "./teams.service";

export class TeamsEditPlayersApply extends ActionUIScene {
	static readonly id = "teams_edit_players_apply";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		teamsService: TeamsService,
	) {
		super(TeamsEditPlayersApply.id, context.getSourcePlayer());

		this.setContext(context);
		const subjectTeam = context.getSubjectTeam()!;
		const targetTeam = context.getTargetTeam()!;

		const action = context.getData("action");
		if (action === "add") {
			this.setSimpleBody("edu_tools.ui.teams_edit_players_apply.add.body");
			teamsService.addPlayerToTeam(subjectTeam.id, targetTeam.memberIds[0]);
		} else if (action === "remove") {
			this.setSimpleBody("edu_tools.ui.teams_edit_players_apply.remove.body");
			teamsService.removePlayerFromTeam(
				subjectTeam.id,
				targetTeam.memberIds[0],
			);
		}

		const updatedSubjectTeam = teamsService.getTeam(subjectTeam.id);
		if (updatedSubjectTeam) {
			context.setSubjectTeam(updatedSubjectTeam);
		}

		this.addButton(
			"edu_tools.ui.buttons.back",
			(): void => {
				sceneManager.goBackToScene(context, "teams_manage_players");
			},
			"textures/edu_tools/ui/icons/_general/back",
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
