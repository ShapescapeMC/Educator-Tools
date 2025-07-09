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
} from "@minecraft/server";
import { Module, ModuleManager } from "../../module-manager";
import { SceneManager } from "../scene_manager/scene-manager";
import { TeamsService } from "../teams/teams.service";

export class ItemService implements Module {
	readonly id: string = "item";
	private readonly moduleManager: ModuleManager;
	private teamsService: TeamsService;

	constructor(moduleManager: ModuleManager) {
		this.moduleManager = moduleManager;
	}

	initialize(): void {
		this.teamsService = this.moduleManager.getModule<TeamsService>(
			TeamsService.id,
		)!;

		this.registerEvents();
	}

	private registerEvents(): void {
		world.afterEvents.itemUse.subscribe((event: ItemUseAfterEvent) => {
			if (event.itemStack.typeId === "edu_tools:educator_tool") {
				this.onEducatorToolUse(event);
			}
		});
		// Register the player spawn event to give the educator tool to the player
		world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent) => {
			this.onPlayerSpawn(event);
		});
	}

	private onEducatorToolUse(event: ItemUseAfterEvent): void {
		const player = event.source as Player;
		const teacherTeam = this.teamsService.getTeam("system_teachers");
		if (teacherTeam?.memberIds.includes(player.id)) {
			// Create a new SceneManager instance with our PropertyStorage
			const sceneManager = SceneManager.getInstance();
			// Create a context and open the main scene
			sceneManager.createContextAndOpenScene(player, "main");
		} else {
			// Send a message to the player that they are not allowed to use the educator tool
			event.source.sendMessage({
				translate: "edu_tools.message.no_host",
			});
		}
	}

	public giveEducatorTool(player: Player): void {
		// give them the Educator Tool if they do not have it yet
		const inventoryComponent = player.getComponent(
			"inventory",
		) as EntityInventoryComponent;
		const inventory = inventoryComponent.container as Container;

		let hasEducatorTool = false;

		for (let i = 0; i < inventory.size; i++) {
			const item = inventory.getItem(i);
			if (item === undefined) {
				continue;
			}
			// if the slot has an emerald item stack add the number of emeralds to
			// the coins variable
			if (item.typeId === "edu_tools:educator_tool") {
				hasEducatorTool = true;
				break;
			}
		}

		if (!hasEducatorTool) {
			let educatorTool = new ItemStack("edu_tools:educator_tool", 1);
			educatorTool.lockMode = ItemLockMode.inventory;
			inventory.addItem(educatorTool);
		}
	}

	private onPlayerSpawn(event: PlayerSpawnAfterEvent): void {
		system.runTimeout(() => {
			const teacherTeam = this.teamsService.getTeam("system_teachers");
			if (teacherTeam?.memberIds.includes(event.player.id)) {
				this.giveEducatorTool(event.player);
			}
		}, 1); // Delay to ensure player is processed correctly
	}
}
