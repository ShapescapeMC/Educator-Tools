import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { TeamsService } from "../teams/teams.service";
import { AssignmentService } from "./assignment.service";

export class AssignmentSubmissionsScene extends ActionUIScene {
	static readonly id = "assignment_submissions";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		assignmentService: AssignmentService,
		teamsService: TeamsService,
	) {
		super(AssignmentSubmissionsScene.id, context.getSourcePlayer());

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

		const submissions = assignmentService.getSubmissions(assignmentId);
		if (submissions.length === 0) {
			this.addLabel({ translate: "edu_tools.ui.assignment.no_submissions" });
		} else {
			for (const submission of submissions) {
				const submissionPlayerName = teamsService.getPlayerIndividualTeam(
					submission.submittedBy,
				)?.name;
				this.addButton(
					{
						rawtext: [
							{ translate: "edu_tools.ui.assignment.submission" },
							{ text: " " + submissionPlayerName },
						],
					},
					() => {
						context.setData("submission", submission);
						sceneManager.openSceneWithContext(context, "assignment_submission_detail", true);
					},
				);
			}
		}

		this.addButton(
			"edu_tools.ui.buttons.back",
			() => {
				sceneManager.goBackToScene(context, "assignment_manage");
			},
			"textures/edu_tools/ui/icons/_general/back",
		);
		this.show(context.getSourcePlayer(), sceneManager);
	}

	private handleError(
		messageKey: string,
		sceneManager: SceneManager,
		context: SceneContext,
	) {
		this.setRawBody([{ translate: messageKey }]);
		this.show(context.getSourcePlayer(), sceneManager);
	}
}
