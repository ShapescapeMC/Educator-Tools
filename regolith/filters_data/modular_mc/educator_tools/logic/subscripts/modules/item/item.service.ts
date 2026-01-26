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

export interface SceneSettings {
	priority: number;
	condition_callback: (player: Player) => boolean;
}

export class ItemService implements Module {
	readonly id: string = "item";
	static readonly id: string = "item";
	private readonly moduleManager: ModuleManager;
	private teamsService: TeamsService | undefined;
	private readonly registeredScenes: Map<string, SceneSettings> = new Map();

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

	public registerScene(sceneId: string, settings: SceneSettings): void {
		this.registeredScenes.set(sceneId, settings);
	}

	public unregisterScene(sceneId: string): void {
		this.registeredScenes.delete(sceneId);
	}

	/**
	 * Get the registered scenes sorted by priority
	 * Higher priority scenes come first
	 * @returns An array of tuples containing the scene ID and its settings
	 */
	private getSortedScenes(): [string, SceneSettings][] {
		return Array.from(this.registeredScenes.entries()).sort(
			(a, b) => b[1].priority - a[1].priority,
		);
	}

	private onEducatorToolUse(event: ItemUseAfterEvent): void {
		const player = event.source as Player;
		const sortedScenes = this.getSortedScenes();
		for (const [sceneId, settings] of sortedScenes) {
			if (settings.condition_callback(player)) {
				const sceneManager = SceneManager.getInstance();
				// Create a context and open the main scene
				sceneManager.createContextAndOpenScene(player, sceneId);
				return;
			}
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
			const teacherTeam = this.teamsService?.getTeam("system_teachers");
			if (teacherTeam?.memberIds.includes(event.player.id)) {
				this.giveEducatorTool(event.player);
			}
		}, 1); // Delay to ensure player is processed correctly
	}
}
