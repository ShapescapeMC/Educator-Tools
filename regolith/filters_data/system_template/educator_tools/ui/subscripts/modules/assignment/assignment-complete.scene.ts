import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { Assignment, AssignmentService } from "./assignment.service";

export class AssignmentCompleteScene extends ActionUIScene {
	static readonly id = "assignment_complete";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		assignmentService: AssignmentService,
	) {
		super(AssignmentCompleteScene.id, context.getSourcePlayer());
		const assignmentID = context.getData("assignment");
		const assignment = assignmentService.getAssignment(
			assignmentID!,
		) as Assignment;
		this.setRawBody([
			{ translate: "edu_tools.ui.assignment.complete.body.1" },
			{ text: " §9" },
			{ text: assignment.title },
			{ text: " §r" },
			{ translate: "edu_tools.ui.assignment.complete.body.2" },
		]);

		this.addDivider();

		this.addButton(
			"edu_tools.ui.assignment.complete.buttons.complete",
			(): void => {
				assignmentService.completeAssignment(assignment.id);
				const target = this.getBackTargetFromHistory(context);
				if (target) {
					sceneManager.goBackToScene(context, target);
				}
			},
			"textures/edu_tools/ui/icons/assignment/assignment_complete",
		);
		this.addButton(
			"edu_tools.ui.assignment.complete.buttons.cancel",
			() => {
				sceneManager.goBackToScene(context, "assignment_manage");
			},
			"textures/edu_tools/ui/icons/_general/back",
		);
		this.show(context.getSourcePlayer(), sceneManager);
	}

	private getBackTargetFromHistory(context: SceneContext): string | undefined {
		const history = context.getHistory();
		const idxActive = history.lastIndexOf("active_assignments");
		const idxCompleted = history.lastIndexOf("completed_assignments");

		if (idxActive === -1 && idxCompleted === -1) return undefined;
		if (idxActive === -1) return "completed_assignments";
		if (idxCompleted === -1) return "active_assignments";
		return idxActive > idxCompleted ? "active_assignments" : "completed_assignments";
	}
}
