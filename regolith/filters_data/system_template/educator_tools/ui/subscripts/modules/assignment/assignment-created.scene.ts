import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { AssignmentService } from "./assignment.service";

export class AssignmentCreatedScene extends ActionUIScene {
	static readonly id = "assignment_created";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		assignmentService: AssignmentService,
	) {
		super(AssignmentCreatedScene.id, context.getSourcePlayer());

		this.setContext(context);
		let assignment = context.getData("assignment");

		if (assignment) {
			this.setRawBody([
				{ translate: "edu_tools.ui.assignment.update.body.1" },
				{ text: " §9" },
				{ text: context.getSubjectTeam()!.name },
				{ text: " §r" },
				{ translate: "edu_tools.ui.assignment.update.body.2" },
			]);
		} else {
			this.setRawBody([
				{ translate: "edu_tools.ui.assignment.create.body.1" },
				{ text: " §9" },
				{ text: context.getSubjectTeam()!.name },
				{ text: " §r" },
				{ translate: "edu_tools.ui.assignment.create.body.2" },
			]);
		}
		const title = assignment
			? assignment.title
			: context.getData("assignment_title") || "";
		const description = assignment
			? assignment.description
			: context.getData("assignment_description") || "";
		const icon = assignment
			? assignment.icon
			: context.getData("assignment_icon") || "";
		const notify = !!context.getData("assignment_notify");

		this.addButton("edu_tools.ui.buttons.continue", (): void => {
			if (assignment) {
				assignmentService.updateAssignment(assignment.id, {
					title,
					description,
					icon,
				});
			} else {
				assignment = assignmentService.createAssignment({
					title,
					description,
					icon,
					assignedTo: context.getSubjectTeam()!.id,
				});
				if (notify) {
					assignmentService.notifyAssignmentCreated(assignment);
				}
			}
			context.setData("assignment", assignment.id);
			sceneManager.openSceneWithContext(context, "assignment_manage", true);
		});

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
