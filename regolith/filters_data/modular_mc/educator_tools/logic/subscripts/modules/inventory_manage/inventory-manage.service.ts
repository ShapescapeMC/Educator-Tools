import { Module, ModuleManager } from "../../module-manager";
import {
	EntityInventoryComponent,
	ItemStack,
	Player,
	world,
} from "@minecraft/server";
import { SceneManager } from "../scene_manager/scene-manager";
import { SceneContext } from "../scene_manager/scene-context";
import { ButtonConfig } from "../main/main.service";
import { Team } from "../teams/interfaces/team.interface";
import { TeamsService } from "../teams/teams.service";
import { InventoryManageScene } from "./inventory-manage.scene";
import { CopyItemScene } from "./copy-item.scene";
import { CopyHotbarScene } from "./copy-hotbar.scene";
import { CopyInventoryScene } from "./copy-inventory.scene";
import { ClearInventoryScene } from "./clear-inventory.scene";

export class InventoryManageService implements Module {
	static readonly id = "inventory_manage";
	public readonly id = InventoryManageService.id;

	private teamsService: TeamsService;

	constructor(private readonly moduleManager: ModuleManager) {}

	initialize(): void {
		this.teamsService = this.moduleManager.getModule(
			TeamsService.id,
		) as TeamsService;
	}

	/**
	 * Registers scenes related to gamemode management.
	 * @param sceneManager - The scene manager
	 */
	registerScenes(sceneManager: SceneManager): void {
		sceneManager.registerScene(
			InventoryManageScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new InventoryManageScene(manager, context);
			},
		);
		sceneManager.registerScene(
			CopyItemScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new CopyItemScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			CopyHotbarScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new CopyHotbarScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			CopyInventoryScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new CopyInventoryScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			ClearInventoryScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new ClearInventoryScene(manager, context, this);
			},
		);
	}

	getMainButton(): ButtonConfig {
		return {
			labelKey: "edu_tools.ui.main.buttons.inventory_manage",
			iconPath: "textures/edu_tools/ui/icons/main/inventory_manage",
			handler: (sceneManager: SceneManager, context: SceneContext) => {
				this.startInventoryManageUI(sceneManager, context);
			},
			weight: 150,
		};
	}

	private startInventoryManageUI(
		sceneManager: SceneManager,
		context: SceneContext,
	): void {
		if (world.getPlayers().length === 1) {
			sceneManager.openSceneWithContext(context, "not_enough_players", false);
		} else {
			sceneManager.openSceneWithContext(context, "inventory_manage", true);
		}
	}

	inventoryCopyToTeam(source: Player, target: Team): void {
		if (!target) return;

		// For each member ID in the team
		target.memberIds.forEach((playerId) => {
			const player = world.getEntity(playerId) as Player;
			if (player && player.id !== source.id) {
				// Copy inventory from source to target player
				this.inventoryCopy(source, player);
			}
		});
	}

	copyHotbarToTeam(source: Player, target: Team): void {
		if (!target) return;
		// For each member ID in the team
		target.memberIds.forEach((playerId) => {
			const player = world.getEntity(playerId) as Player;
			if (player && player.id !== source.id) {
				// Copy hotbar from source to target player
				this.copyHotbar(source, player);
			}
		});
	}

	copyItemToTeam(source: Player, target: Team, index: number): void {
		if (!target && index >= 0) return;
		// For each member ID in the team
		target.memberIds.forEach((playerId) => {
			const player = world.getEntity(playerId) as Player;
			if (player && player.id !== source.id) {
				// Copy item from source to target player
				this.copyItem(source, player, index);
			}
		});
	}

	getItemsInInventory(player: Player): { itemName: string; index: number }[] {
		const components = player.getComponent(
			EntityInventoryComponent.componentId,
		) as EntityInventoryComponent;
		const items: { itemName: string; index: number }[] = [];
		if (components && components.container) {
			for (let i = 0; i < components.container.size; i++) {
				const item = components.container.getItem(i);
				if (item && item.typeId !== "minecraft:air") {
					let itemName = item.nameTag || item.typeId;
					if (items.some((i) => i.itemName === itemName)) {
						itemName += ` (${i + 1})`; // Append index if item already exists
					}
					// Add the item to the list with its index
					items.push({ itemName, index: i });
				}
			}
		}
		return items;
	}

	clearInventory(player: Player): void {
		const components = player.getComponent(
			EntityInventoryComponent.componentId,
		) as EntityInventoryComponent;
		if (components && components.container) {
			components.container.clearAll();
		}
	}

	clearInventoryOfTeam(team: Team): void {
		if (!team) return;
		// For each member ID in the team
		team.memberIds.forEach((playerId) => {
			const player = world.getEntity(playerId) as Player;
			if (player) {
				// Clear inventory of the player
				this.clearInventory(player);
			}
		});
	}

	private inventoryCopy(source: Player, target: Player): void {
		const sComponents = source.getComponent(
			EntityInventoryComponent.componentId,
		) as EntityInventoryComponent;
		const tComponents = target.getComponent(
			EntityInventoryComponent.componentId,
		) as EntityInventoryComponent;
		if (
			sComponents &&
			tComponents &&
			sComponents.container &&
			tComponents.container
		) {
			tComponents.container.clearAll();
			for (let i = 0; i < sComponents.container.size; i++) {
				const item = sComponents.container.getItem(i);
				if (tComponents.container.size > i) {
					if (
						item &&
						item.typeId === "edu_tools:educator_tool" &&
						!this.shouldGiveEducatorTool(target)
					) {
						// Do not copy the Educator Tool if the target player is not a teacher
						continue;
					}
					tComponents.container.setItem(i, item);
				}
			}
			if (this.shouldGiveEducatorTool(target)) {
				if (!this.giveItem(target, "edu_tools:educator_tool")) {
					world.sendMessage({
						translate: "edu_tools.message.no_space_for_educator_tool",
					});
				}
			}
		}
	}

	private copyHotbar(source: Player, target: Player): void {
		const sComponents = source.getComponent(
			EntityInventoryComponent.componentId,
		) as EntityInventoryComponent;
		const tComponents = target.getComponent(
			EntityInventoryComponent.componentId,
		) as EntityInventoryComponent;
		if (
			sComponents &&
			tComponents &&
			sComponents.container &&
			tComponents.container
		) {
			for (let i = 0; i < 9; i++) {
				const item = sComponents.container.getItem(i);
				if (tComponents.container.size > i) {
					if (item && item.typeId === "edu_tools:educator_tool") {
						// Do not copy the Educator Tool if the target player is not a teacher
						if (!this.shouldGiveEducatorTool(target)) {
							continue;
						}
					}
					tComponents.container.setItem(i, item);
				}
			}
			if (this.shouldGiveEducatorTool(target)) {
				if (!this.giveItem(target, "edu_tools:educator_tool")) {
					world.sendMessage({
						translate: "edu_tools.message.no_space_for_educator_tool",
					});
				}
			}
		}
	}

	private copyItem(source: Player, target: Player, index: number): boolean {
		const sComponents = source.getComponent(
			EntityInventoryComponent.componentId,
		) as EntityInventoryComponent;
		const tComponents = target.getComponent(
			EntityInventoryComponent.componentId,
		) as EntityInventoryComponent;
		if (
			sComponents &&
			tComponents &&
			sComponents.container &&
			tComponents.container
		) {
			const item = sComponents.container.getItem(index);
			if (item) {
				if (
					item.typeId === "edu_tools:educator_tool" &&
					!this.shouldGiveEducatorTool(target)
				) {
					return false; // Do not copy the Educator Tool if the target player is not a teacher
				}
				return this.giveItem(target, item);
			}
		}
		return false; // Item not found or could not be copied
	}

	private shouldGiveEducatorTool(target: Player): boolean {
		const isTeacher = this.teamsService
			.getTeam("system_teachers")
			?.memberIds.includes(target.id);
		const tComponents = target.getComponent(
			EntityInventoryComponent.componentId,
		) as EntityInventoryComponent;
		if (tComponents && tComponents.container) {
			for (let i = 0; i < tComponents.container.size; i++) {
				const item = tComponents.container.getItem(i);
				if (item && item.typeId === "edu_tools:educator_tool") {
					return false; // Already has the Educator Tool
				}
			}
		}
		return !!isTeacher; // Only give if the source is a teacher
	}

	private giveItem(target: Player, item: string | ItemStack): boolean {
		const components = target.getComponent(
			EntityInventoryComponent.componentId,
		) as EntityInventoryComponent;
		if (components && components.container) {
			for (let i = 0; i < components.container.size; i++) {
				const sourceItem = components.container.getItem(i);
				if (!sourceItem || sourceItem.typeId === "minecraft:air") {
					const itemStack =
						typeof item === "string" ? new ItemStack(item, 1) : item;
					components.container.setItem(i, itemStack);
					return true;
				}
			}
		}
		return false; // No space left in the inventory
	}
}
