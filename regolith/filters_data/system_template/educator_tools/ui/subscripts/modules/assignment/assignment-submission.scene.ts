import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { TeamsService } from "../teams/teams.service";
import { AssignmentService, Submission } from "./assignment.service";

export class AssignmentSubmissionScene extends ActionUIScene {
	static readonly id = "assignment_submission_detail";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		assignmentService: AssignmentService,
		teamsService: TeamsService,
	) {
		super(AssignmentSubmissionScene.id, context.getSourcePlayer());

		const submission = context.getData("submission") as Submission;
		const submissionPlayerName = teamsService.getPlayerIndividualTeam(
			submission.submittedBy,
		)?.name;
		const assignment = assignmentService.getAssignment(submission.assignmentId);

		this.addLabel({
			rawtext: [
				{ translate: "edu_tools.ui.assignment.submission_detail.from" },
				{ text: " " + submissionPlayerName + " " },
				{ translate: "edu_tools.ui.assignment.submission.for_assignment" },
				{ text: " " + assignment?.title },
			],
		});
		this.addDivider();
		this.addLabel({
			rawtext: [
				{ translate: "edu_tools.ui.assignment.submission_details.note" },
				{ text: ": " + submission.note },
			],
		});
		this.addLabel({
			rawtext: [
				{ translate: "edu_tools.ui.assignment.submission_details.location" },
				{
					text:
						": X: " +
						Math.trunc(submission.location.x) +
						", Y: " +
						Math.trunc(submission.location.y) +
						", Z: " +
						Math.trunc(submission.location.z),
				},
			],
		});
		this.addButton(
			"edu_tools.ui.assignment.submission_details.buttons.teleport",
			() => {
				context.getSourcePlayer().teleport(submission.location);
			},
			"textures/edu_tools/ui/icons/assignment/teleport",
		);
		this.addButton(
			"edu_tools.ui.buttons.back",
			() => {
				sceneManager.goBackToScene(context, "assignment_manage");
			},
			"textures/edu_tools/ui/icons/_general/back",
		);
		this.show(context.getSourcePlayer(), sceneManager);
	}
}
