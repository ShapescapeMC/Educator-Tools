import { CachedStorage, PropertyStorage } from "@shapescape/storage";
import { world } from "@minecraft/server";
import { Assignment, AssignmentData, Submission } from "./assignment.service";

export class AssignmentRepository {
	private readonly storage: PropertyStorage;

	constructor() {
		this.storage = new CachedStorage(world, "assignment");
	}

	createAssignment(id: string, data: AssignmentData): void {
		this.storage.set(id, data);
		this.storage.rPush("active", id);
	}

	getAssignment(id: string): AssignmentData | undefined {
		return this.storage.get(id);
	}

	updateAssignment(id: string, data: AssignmentData): void {
		this.storage.set(id, data);
	}

	deleteAssignment(id: string): boolean {
		const existingData = this.storage.get(id);
		if (!existingData) {
			return false;
		}
		this.storage.drop(id);
		this.removeFromActiveList(id);
		this.removeFromCompletedList(id);
		this.clearAssignmentStorage(id);
		return true;
	}

	moveToCompleted(id: string): boolean {
		const existingData = this.storage.get(id);
		if (!existingData) {
			return false;
		}
		this.addToCompletedList(id);
		this.removeFromActiveList(id);
		return true;
	}

	getActiveAssignmentIds(): string[] {
		return this.storage.get("active") || [];
	}

	getCompletedAssignmentIds(): string[] {
		return this.storage.get("completed") || [];
	}

	addSubmission(
		assignmentId: string,
		submissionId: string,
		submission: Submission,
	): void {
		const assignmentStorage = this.storage.getSubStorage(assignmentId);
		if (assignmentStorage) {
			assignmentStorage.set(submissionId, submission);
		}
	}

	getSubmissionData(assignmentId: string, submissionId: string): any {
		const assignmentStorage = this.storage.getSubStorage(assignmentId);
		return assignmentStorage?.get(submissionId);
	}

	getSubmissionIds(assignmentId: string): string[] {
		const assignmentStorage = this.storage.getSubStorage(assignmentId);
		return assignmentStorage?.getKeys() || [];
	}

	updateSubmission(
		assignmentId: string,
		submissionId: string,
		data: any,
	): void {
		const assignmentStorage = this.storage.getSubStorage(assignmentId);
		if (assignmentStorage) {
			assignmentStorage.set(submissionId, data);
		}
	}

	deleteSubmission(assignmentId: string, submissionId: string): boolean {
		const assignmentStorage = this.storage.getSubStorage(assignmentId);
		if (!assignmentStorage) {
			return false;
		}
		const existingData = assignmentStorage.get(submissionId);
		if (!existingData) {
			return false;
		}
		assignmentStorage.drop(submissionId);
		return true;
	}

	private removeFromActiveList(id: string): void {
		const activeAssignments = this.storage.get("active") || [];
		const index = activeAssignments.indexOf(id);
		if (index > -1) {
			activeAssignments.splice(index, 1);
			this.storage.set("active", activeAssignments);
		}
	}

	private removeFromCompletedList(id: string): void {
		const completedAssignments = this.storage.get("completed") || [];
		const index = completedAssignments.indexOf(id);
		if (index > -1) {
			completedAssignments.splice(index, 1);
			this.storage.set("completed", completedAssignments);
		}
	}

	private addToCompletedList(id: string): void {
		const completedAssignments = this.storage.get("completed") || [];
		if (!completedAssignments.includes(id)) {
			completedAssignments.push(id);
			this.storage.set("completed", completedAssignments);
		}
	}

	private clearAssignmentStorage(id: string): void {
		const assignmentStorage = this.storage.getSubStorage(id);
		if (assignmentStorage) {
			assignmentStorage.clear();
		}
	}
}
