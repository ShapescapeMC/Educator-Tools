import { ModuleManager } from "../../module-manager";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { TeamsService } from "../teams/teams.service";
import { AssignmentService } from "./assignment.service";

export class AssignmentStudentListScene extends ActionUIScene {
	static readonly id = "assignment_student_list";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		assignmentService: AssignmentService,
	) {
		super(AssignmentStudentListScene.id, context.getSourcePlayer());

		const teamsService = ModuleManager.getInstance().getModule(
			TeamsService.id,
		) as TeamsService;
		const playerTeams = teamsService.getPlayerTeams(
			context.getSourcePlayer().id,
		);

		const assignments = assignmentService.getTeamsAssignments(
			playerTeams.map((team) => team.id),
			true,
		);

		if (assignments.length === 0) {
			this.setRawBody([
				{ translate: "edu_tools.ui.assignment.no_assignments" },
			]);
		} else {
			for (const assignment of assignments) {
				this.addButton(
					assignment.title,
					() => {
						context.setData("assignment", assignment.id);
						sceneManager.openSceneWithContext(
							context,
							"assignment_student_detail",
							true,
						);
					},
					"textures/edu_tools/ui/icons/generic/" + assignment.icon,
				);
			}
		}

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
