import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { Assignment, AssignmentService } from "./assignment.service";

export class AssignmentDeleteScene extends ActionUIScene {
	static readonly id = "assignment_delete";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		assignmentService: AssignmentService,
	) {
		super(AssignmentDeleteScene.id, context.getSourcePlayer());
		const assignmentID = context.getData("assignment");
		const assignment = assignmentService.getAssignment(
			assignmentID!,
		) as Assignment;
		this.setRawBody([
			{ translate: "edu_tools.ui.assignment.delete.body.1" },
			{ text: " §9" },
			{ text: assignment.title },
			{ text: " §r" },
			{ translate: "edu_tools.ui.assignment.delete.body.2" },
		]);

		this.addDivider();

		this.addButton(
			"edu_tools.ui.assignment.delete.buttons.delete",
			(): void => {
				assignmentService.deleteAssignment(assignment.id);
				sceneManager.goBackToScene(context, "assignment_list_teacher");
			},
			"textures/edu_tools/ui/icons/assignment/assignment_delete",
		);
		this.addButton(
			"edu_tools.ui.assignment.delete.buttons.cancel",
			() => {
				sceneManager.goBackToScene(context, "assignment_manage");
			},
			"textures/edu_tools/ui/icons/_general/back",
		);
		this.show(context.getSourcePlayer(), sceneManager);
	}
}
