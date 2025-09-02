import { world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { AssignmentService } from "./assignment.service";

export class AssignmentStudentDetailScene extends ActionUIScene {
	static readonly id = "assignment_student_detail";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		assignmentService: AssignmentService,
	) {
		super(AssignmentStudentDetailScene.id, context.getSourcePlayer());

		const assignmentId = context.getData("assignment");
		const assignment = assignmentId
			? assignmentService.getAssignment(assignmentId)
			: null;

		// Handle error states
		if (!assignmentId || !assignment) {
			this.handleError(
				assignmentId
					? "edu_tools.ui.assignment.assignment_not_found"
					: "edu_tools.ui.assignment.no_assignment_selected",
				sceneManager,
				context,
			);
			return;
		}

		const submission = assignmentService.getPlayerSubmissions(
			assignmentId,
			context.getSourcePlayer().id,
		);
		const isActive = assignmentService.isAssignmentActive(assignmentId);

		// Display assignment details
		this.addLabel(assignment.title);
		this.addLabel(assignment.description);
		this.addDivider();

		// Handle submission UI
		this.handleSubmissionUI(
			isActive,
			submission.length > 0,
			sceneManager,
			context,
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}

	private handleError(
		messageKey: string,
		sceneManager: SceneManager,
		context: SceneContext,
	) {
		this.setRawBody([{ translate: messageKey }]);
		this.addBackButton(sceneManager, context);
		this.show(context.getSourcePlayer(), sceneManager);
	}

	private handleSubmissionUI(
		isActive: boolean,
		submission: boolean,
		sceneManager: SceneManager,
		context: SceneContext,
	) {
		if (isActive && !submission) {
			this.addButton(
				"edu_tools.ui.assignment_student_detail.submit",
				() => {
					sceneManager.openSceneWithContext(
						context,
						"assignment_student_submit",
						true,
					);
				},
				"textures/edu_tools/ui/icons/assignment/submit",
			);
		} else {
			const messageKey =
				isActive && submission
					? "edu_tools.ui.assignment_student_detail.already_submitted"
					: "edu_tools.ui.assignment_student_detail.completed";

			this.addLabel({ translate: messageKey });
			this.addBackButton(sceneManager, context);
		}
	}

	private addBackButton(sceneManager: SceneManager, context: SceneContext) {
		this.addButton(
			"edu_tools.ui.buttons.back",
			() => {
				sceneManager.goBackToScene(context, "assignment_student_list");
			},
			"textures/edu_tools/ui/icons/_general/back",
		);
	}
}
