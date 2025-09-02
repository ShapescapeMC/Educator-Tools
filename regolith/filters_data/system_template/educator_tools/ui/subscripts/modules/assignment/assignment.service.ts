import { Module, ModuleManager } from "../../module-manager";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { Player, Vector3, world } from "@minecraft/server";
import { AssignmentRepository } from "./assignment.repository";
import { TeamsService } from "../teams/teams.service";
import { AssignmentTeacherScene } from "./assignment-teacher.scene";
import { AssignmentListTeacherScene } from "./assignment-list-teacher.scene";
import { AssignmentManageScene } from "./assignment-manage.scene";
import { AssignmentCreatedScene } from "./assignment-created.scene";
import { ButtonConfig } from "../main/main.service";
import { AssignmentCreateScene } from "./assignment-create.scene";
import { AssignmentStudentListScene } from "./assignment-student-list.scene";
import { AssignmentStudentDetailScene } from "./assignment-student-detail.scene";
import { AssignmentStudentSubmitScene } from "./assignment-student-submit.scene";
import { AssignmentSubmissionsScene } from "./assignment-submissions.scene";
import { AssignmentSubmissionScene } from "./assignment-submission.scene";
import { AssignmentDeleteScene } from "./assignment-delete.scene";

export interface Assignment {
	id: string;
	title: string;
	description: string;
	icon: string;
	assignedTo: string; // Team ID
}

export interface Submission {
	id: string;
	note: string;
	location: Vector3;
	submittedBy: string; // Player ID
	assignmentId: string; // ID of the assignment this submission belongs to
}

export class AssignmentService implements Module {
	static readonly id = "assignment";
	public readonly id = AssignmentService.id;
	private readonly repository: AssignmentRepository;
	private teamsService: TeamsService;

	public static readonly availableIcons = [
		"clownfish",
		"diamond",
		"egg",
		"iron_axe",
		"potato",
	];

	constructor(private readonly moduleManager: ModuleManager) {
		this.repository = new AssignmentRepository();
	}

	initialize(): void {
		this.teamsService = this.moduleManager.getModule(
			TeamsService.id,
		) as TeamsService;
	}

	registerScenes(sceneManager: SceneManager): void {
		// Register scenes related to assignment management
		sceneManager.registerScene(
			AssignmentTeacherScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new AssignmentTeacherScene(manager, context);
			},
		);
		sceneManager.registerScene(
			"active_assignments",
			(manager: SceneManager, context: SceneContext) => {
				new AssignmentListTeacherScene(manager, context, this, "active");
			},
		);
		sceneManager.registerScene(
			"completed_assignments",
			(manager: SceneManager, context: SceneContext) => {
				new AssignmentListTeacherScene(manager, context, this, "completed");
			},
		);
		sceneManager.registerScene(
			AssignmentManageScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new AssignmentManageScene(manager, context, this, this.teamsService);
			},
		);
		sceneManager.registerScene(
			AssignmentCreatedScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new AssignmentCreatedScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			AssignmentCreateScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new AssignmentCreateScene(manager, context, this.teamsService);
			},
		);
		sceneManager.registerScene(
			AssignmentStudentListScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new AssignmentStudentListScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			AssignmentStudentDetailScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new AssignmentStudentDetailScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			AssignmentStudentSubmitScene.id,
			(manager: SceneManager, context: SceneContext) => {
				// This scene is for students to submit their assignments
				new AssignmentStudentSubmitScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			AssignmentSubmissionsScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new AssignmentSubmissionsScene(
					manager,
					context,
					this,
					this.teamsService,
				);
			},
		);
		sceneManager.registerScene(
			AssignmentSubmissionScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new AssignmentSubmissionScene(
					manager,
					context,
					this,
					this.teamsService,
				);
			},
		);
		sceneManager.registerScene(
			AssignmentDeleteScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new AssignmentDeleteScene(manager, context, this);
			},
		);
	}

	getMainButton(): ButtonConfig {
		return {
			labelKey: "edu_tools.ui.main.buttons.assignments",
			iconPath: "textures/edu_tools/ui/icons/main/assignments",
			handler: (sceneManager: SceneManager, context: SceneContext) => {
				sceneManager.openSceneWithContext(context, "assignment_teacher", true);
			},
			weight: 60,
		};
	}

	notifyAssignmentCreated(assignment: Assignment): void {
		// Notify players about the new assignment
		const team = this.teamsService.getTeam(assignment.assignedTo);
		if (!team) {
			return;
		}
		for (const memberId of team.memberIds) {
			const player = world.getEntity(memberId) as Player;
			if (player) {
				player.sendMessage([
					{ translate: "edu_tools.message.assignment.new_assignment" },
					{ text: ` ${assignment.title}` },
				]);
			}
		}
	}

	createAssignment(data: Omit<Assignment, "id">): Assignment {
		const id = this.generateRandomHash(data);
		this.repository.createAssignment(id, data);
		return {
			...data,
			id: id,
		};
	}

	getAssignment(id: string): Assignment | undefined {
		const data = this.repository.getAssignment(id);
		if (data) {
			return { ...data, id: id };
		}
		return;
	}

	updateAssignment(
		id: string,
		data: Partial<Omit<Assignment, "id">>,
	): Assignment | undefined {
		const existingData = this.repository.getAssignment(id);
		if (!existingData) {
			return;
		}
		const updatedData = { ...existingData, ...data };
		this.repository.updateAssignment(id, updatedData);
		return { ...updatedData, id: id };
	}

	deleteAssignment(id: string): boolean {
		return this.repository.deleteAssignment(id);
	}

	completeAssignment(id: string): boolean {
		return this.repository.moveToCompleted(id);
	}

	isAssignmentActive(id: string): boolean {
		return this.repository.isAssignmentActive(id);
	}

	getActiveAssignments(): Assignment[] {
		const activeIds = this.repository.getActiveAssignmentIds();
		return activeIds
			.map((id: string) => this.getAssignment(id))
			.filter((assignment: any): assignment is Assignment => !!assignment);
	}

	getCompletedAssignments(): Assignment[] {
		const completedIds = this.repository.getCompletedAssignmentIds();
		return completedIds
			.map((id: string) => this.getAssignment(id))
			.filter((assignment: any): assignment is Assignment => !!assignment);
	}

	addSubmission(
		assignmentId: string,
		player: Player,
		submission: Omit<Submission, "id" | "assignmentId" | "submittedBy">,
	): Submission | undefined {
		const assignmentData = this.repository.getAssignment(assignmentId);
		if (!assignmentData) {
			return undefined;
		}
		const id = this.generateRandomHash(submission);
		const newSubmission: Submission = {
			...submission,
			id: id,
			assignmentId: assignmentId,
			submittedBy: player.id,
		};
		this.repository.addSubmission(assignmentId, id, newSubmission);
		return newSubmission;
	}

	getSubmissions(assignmentId: string): Submission[] {
		const submissionIds = this.repository.getSubmissionIds(assignmentId);
		return submissionIds
			.map((id: string) => {
				const data = this.repository.getSubmissionData(assignmentId, id);
				if (data) {
					return { ...data, id: id, assignmentId: assignmentId };
				}
				return undefined;
			})
			.filter((submission: any): submission is Submission => !!submission);
	}

	getSubmission(
		assignmentId: string,
		submissionId: string,
	): Submission | undefined {
		const data = this.repository.getSubmissionData(assignmentId, submissionId);
		if (data) {
			return { ...data, id: submissionId, assignmentId: assignmentId };
		}
		return undefined;
	}

	updateSubmission(
		assignmentId: string,
		submissionId: string,
		data: Partial<Omit<Submission, "id" | "assignmentId">>,
	): Submission | undefined {
		const existingData = this.repository.getSubmissionData(
			assignmentId,
			submissionId,
		);
		if (!existingData) {
			return undefined;
		}
		const updatedData = { ...existingData, ...data };
		this.repository.updateSubmission(assignmentId, submissionId, updatedData);
		return { ...updatedData, id: submissionId, assignmentId: assignmentId };
	}

	deleteSubmission(assignmentId: string, submissionId: string): boolean {
		return this.repository.deleteSubmission(assignmentId, submissionId);
	}

	getPlayerSubmissions(playerId: string, assignmentId: string): Submission[] {
		const submissions = this.getSubmissions(assignmentId);
		const playerSubmissions: Submission[] = [];
		for (const submission of submissions) {
			if (submission.submittedBy === playerId) {
				playerSubmissions.push(submission);
			}
		}
		return playerSubmissions;
	}

	getTeamsAssignments(
		teamIds: string | string[],
		onlyActive: boolean = true,
	): Assignment[] {
		const assignments: Assignment[] = [];
		const activeAssignments = this.getActiveAssignments();
		if (onlyActive) {
			activeAssignments.push(...this.getCompletedAssignments());
		}
		const teamArray = Array.isArray(teamIds) ? teamIds : [teamIds];
		for (const assignment of activeAssignments) {
			if (teamArray.includes(assignment.assignedTo)) {
				assignments.push(assignment);
			}
		}
		return assignments;
	}

	private generateRandomHash(data: any): string {
		const str = JSON.stringify(data);
		let hash = 0;
		for (let i = 0, len = str.length; i < len; i++) {
			let chr = str.charCodeAt(i);
			hash = (hash << 5) - hash + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return "h" + (hash + Math.floor(Math.random() * 1000000)); // Add some randomness to avoid collisions
	}
}
