import {
	ItemUseAfterEvent,
	Player,
	EntityInventoryComponent,
	Container,
	ItemStack,
	ItemLockMode,
	PlayerSpawnAfterEvent,
	world,
	system,
	PlayerLeaveAfterEvent,
} from "@minecraft/server";
import { Module, ModuleManager } from "../../module-manager";
import { SceneManager } from "../scene_manager/scene-manager";
import { TeamsService } from "../teams/teams.service";
import { AssignmentService } from "../assignment/assignment.service";

export class AssignmentItemService implements Module {
	readonly id: string = "assignment_item";
	private readonly moduleManager: ModuleManager;
	private assignmentService: AssignmentService;
	private teamsService: TeamsService;

	private playerTasks: Map<string, number> = new Map();

	constructor(moduleManager: ModuleManager) {
		this.moduleManager = moduleManager;
	}

	initialize(): void {
		this.teamsService = this.moduleManager.getModule<TeamsService>(
			TeamsService.id,
		)!;
		this.assignmentService = this.moduleManager.getModule<AssignmentService>(
			AssignmentService.id,
		)!;

		this.registerEvents();
	}

	private registerEvents(): void {
		world.afterEvents.itemUse.subscribe((event: ItemUseAfterEvent) => {
			if (event.itemStack.typeId === "edu_tools:assignment") {
				this.onAssignmentToolUse(event);
			}
		});
		world.getAllPlayers().forEach((player) => {
			this.registerTask(player);
		});
		world.afterEvents.playerLeave.subscribe((event: PlayerLeaveAfterEvent) => {
			this.onPlayerLogout(event);
		});
	}

	private onAssignmentToolUse(event: ItemUseAfterEvent): void {
		const player = event.source as Player;
		// Create a new SceneManager instance with our PropertyStorage
		const sceneManager = SceneManager.getInstance();
		// Create a context and open the assignment student list scene
		sceneManager.createContextAndOpenScene(player, "assignment_student_list");
	}

	public giveAssignmentTool(player: Player): void {
		// give them the Assignment Tool if they do not have it yet
		const inventoryComponent = player.getComponent(
			"inventory",
		) as EntityInventoryComponent;
		const inventory = inventoryComponent.container as Container;

		let hasAssignmentTool = false;

		for (let i = 0; i < inventory.size; i++) {
			const item = inventory.getItem(i);
			if (item === undefined) {
				continue;
			}
			// if the slot has an emerald item stack add the number of emeralds to
			// the coins variable
			if (item.typeId === "edu_tools:assignment") {
				hasAssignmentTool = true;
				break;
			}
		}

		if (!hasAssignmentTool) {
			let assignmentTool = new ItemStack("edu_tools:assignment", 1);
			assignmentTool.lockMode = ItemLockMode.inventory;
			inventory.addItem(assignmentTool);
		}
	}

	private registerTask(player: Player): void {
		if (this.playerTasks.has(player.id)) {
			return;
		}
		const task = system.runInterval(() => {
			const playerTeams = this.teamsService.getPlayerTeams(player.id);
			const assignments = this.assignmentService.getTeamsAssignments(
				playerTeams.map((team) => team.id),
				true,
			);
			if (assignments.length > 0) {
				this.giveAssignmentTool(player);
			}
		}, 5 * 20 + Math.random() * 20);
		this.playerTasks.set(player.id, task);
	}

	private onPlayerLogout(event: PlayerLeaveAfterEvent): void {
		const task = this.playerTasks.get(event.playerId);
		if (task) {
			system.clearRun(task);
			this.playerTasks.delete(event.playerId);
		}
	}
}
