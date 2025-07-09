import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { Assignment, AssignmentService } from "./assignment.service";

export class AssignmentListTeacherScene extends ActionUIScene {
	static readonly id = "assignment_list_teacher";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		assignmentService: AssignmentService,
		scope: "active" | "completed",
	) {
		super(AssignmentListTeacherScene.id, context.getSourcePlayer());

		let assignments: Assignment[] = [];
		if (scope === "active") {
			assignments = assignmentService.getActiveAssignments();
		} else if (scope === "completed") {
			assignments = assignmentService.getCompletedAssignments();
		}

		if (assignments.length === 0) {
			this.setRawBody([
				{ translate: "edu_tools.ui.assignment.no_assignments" },
			]);
		}

		for (const assignment of assignments) {
			this.addButton(
				assignment.title,
				() => {
					context.setData("assignment", assignment.id);
					sceneManager.openSceneWithContext(context, "assignment_manage", true);
				},
				"textures/edu_tools/ui/icons/generic/" + assignment.icon,
			);
		}

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
