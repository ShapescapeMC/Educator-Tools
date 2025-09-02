import { world, Player } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { Team } from "../teams/interfaces/team.interface";
import { TeamsService } from "../teams/teams.service";
import { AssignmentService } from "./assignment.service";

export class AssignmentManageScene extends ActionUIScene {
	static readonly id = "assignment_manage";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		assignmentService: AssignmentService,
		teamsService: TeamsService,
	) {
		super(AssignmentManageScene.id, context.getSourcePlayer());
		const assignmentID = context.getData("assignment");
		const assignment = assignmentService.getAssignment(assignmentID!);
		if (!assignment) throw new Error("Assignment not found");
		const assignedTeam = teamsService.getTeam(assignment.assignedTo);
		this.setRawBody([
			{ translate: "edu_tools.ui.assignment.manage.body.1" },
			{ text: " §9" },
			{ text: assignedTeam!.name },
			{ text: " §r" },
			{ translate: "edu_tools.ui.assignment.manage.body.2" },
		]);

		this.addDivider();
		this.addLabel(assignment.title);
		this.addLabel(assignment.description);
		this.addDivider();

		this.addButton(
			"edu_tools.ui.assignment.manage.buttons.assignment_update",
			(): void => {
				sceneManager.openSceneWithContext(context, "assignment_create", true);
			},
			"textures/edu_tools/ui/icons/assignment/assignment_update",
		);
		this.addButton(
			"edu_tools.ui.assignment.manage.buttons.assignment_complete",
			(): void => {
				sceneManager.openSceneWithContext(context, "assignment_complete", true);
			},
			"textures/edu_tools/ui/icons/assignment/assignment_complete",
		);
		this.addButton(
			"edu_tools.ui.assignment.manage.buttons.assignment_delete",
			(): void => {
				sceneManager.openSceneWithContext(context, "assignment_delete", true);
			},
			"textures/edu_tools/ui/icons/assignment/assignment_delete",
		);
		this.addButton(
			"edu_tools.ui.assignment.manage.buttons.assignment_submissions",
			(): void => {
				sceneManager.openSceneWithContext(
					context,
					"assignment_submissions",
					true,
				);
			},
			"textures/edu_tools/ui/icons/assignment/assignment_submissions",
		);
		this.show(context.getSourcePlayer(), sceneManager);
	}
}
