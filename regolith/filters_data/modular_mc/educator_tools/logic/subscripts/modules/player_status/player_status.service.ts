import {
	InputPermissionCategory,
	Player,
	GameMode,
	HudElement,
	HudVisibility,
} from "@minecraft/server";
import { Module } from "../../module-manager";
import { PropertyStorage } from "@shapescape/storage";

export class PlayerStatusService implements Module {
	static id = "player_status";
	readonly id = PlayerStatusService.id;

	constructor() {}

	savePlayerInputPermissions(player: Player) {
		const playerStorage = new PropertyStorage(
			player,
			"player_input_permissions",
		);
		for (const permission of Object.values(InputPermissionCategory).filter(
			(value) => typeof value === "string",
		)) {
			playerStorage.set(
				permission.toString(),
				player.inputPermissions.isPermissionCategoryEnabled(
					InputPermissionCategory[permission],
				),
			);
		}
		playerStorage.set("has_input_permissions", true);
	}

	savePlayerGameMode(player: Player) {
		const playerStorage = new PropertyStorage(player, "player_gamemode");
		playerStorage.set("gamemode", player.getGameMode());
	}

	savePlayerHudElements(player: Player) {
		const playerStorage = new PropertyStorage(player, "player_hud_elements");
		for (const hudElement of Object.values(HudElement).filter(
			(value) => typeof value === "string",
		)) {
			playerStorage.set(
				`hud_${hudElement}`,
				player.onScreenDisplay
					.getHiddenHudElements()
					.includes(HudElement[hudElement]),
			);
		}
		playerStorage.set("has_hud_elements", true);
	}

	hasInputPermissionsSaved(player: Player): boolean {
		const playerStorage = new PropertyStorage(
			player,
			"player_input_permissions",
		);
		return playerStorage.get("has_input_permissions", true, true) === true;
	}

	hasGameModeSaved(player: Player): boolean {
		const playerStorage = new PropertyStorage(player, "player_gamemode");
		return !!playerStorage.get("gamemode", true, undefined);
	}

	hasHudElementsSaved(player: Player): boolean {
		const playerStorage = new PropertyStorage(player, "player_hud_elements");
		return playerStorage.get("has_hud_elements", true, true) === true;
	}

	deletePlayerInputPermissions(player: Player): void {
		const playerStorage = new PropertyStorage(
			player,
			"player_input_permissions",
		);
		playerStorage.clear();
	}

	deletePlayerGameMode(player: Player): void {
		const playerStorage = new PropertyStorage(player, "player_gamemode");
		playerStorage.clear();
	}

	deletePlayerHudElements(player: Player): void {
		const playerStorage = new PropertyStorage(player, "player_hud_elements");
		playerStorage.clear();
	}

	setAllInputPermissions(player: Player, enabled: boolean): void {
		for (const permission of Object.values(InputPermissionCategory).filter(
			(value) => typeof value === "string",
		)) {
			player.inputPermissions.setPermissionCategory(
				InputPermissionCategory[permission],
				enabled,
			);
		}
	}

	restorePlayerInputPermissions(player: Player): void {
		const playerStorage = new PropertyStorage(
			player,
			"player_input_permissions",
		);
		if (this.hasInputPermissionsSaved(player)) {
			for (const permission of Object.values(InputPermissionCategory).filter(
				(value) => typeof value === "string",
			)) {
				const isEnabled = playerStorage.get(permission, true, true);
				player.inputPermissions.setPermissionCategory(
					InputPermissionCategory[permission],
					isEnabled,
				);
			}
		}
	}

	restorePlayerGameMode(player: Player): void {
		const playerStorage = new PropertyStorage(player, "player_gamemode");
		if (this.hasGameModeSaved(player)) {
			const gamemode = playerStorage.get("gamemode", true, GameMode.Survival);
			player.setGameMode(gamemode);
		}
	}

	restorePlayerHudElements(player: Player): void {
		const playerStorage = new PropertyStorage(player, "player_hud_elements");
		if (this.hasHudElementsSaved(player)) {
			for (const hudElement of Object.values(HudElement).filter(
				(value) => typeof value === "string" && value !== "All",
			)) {
				const isVisible = playerStorage.get(
					`hud_${hudElement.toString()}`,
					true,
					true,
				);
				player.onScreenDisplay.setHudVisibility(
					isVisible ? HudVisibility.Reset : HudVisibility.Hide,
					[HudElement[hudElement]],
				);
			}
		}
	}

	registerHolder(player: Player, holderId: string): void {
		const playerStorage = new PropertyStorage(player, "player_status");
		const holders = this.getHolders(player);
		if (!holders.includes(holderId)) {
			holders.push(holderId);
			playerStorage.set("holders", holders);
		}
	}

	getHolders(player: Player): string[] {
		const playerStorage = new PropertyStorage(player, "player_status");
		return playerStorage.get("holders", true, []);
	}

	deleteHolder(player: Player, holderId: string): void {
		const playerStorage = new PropertyStorage(player, "player_status");
		const holders = this.getHolders(player);
		const index = holders.indexOf(holderId);
		if (index > -1) {
			holders.splice(index, 1);
			playerStorage.set("holders", holders);
		}
	}

	isHolderRegistered(player: Player, holderId: string): boolean {
		const holders = this.getHolders(player);
		return holders.includes(holderId);
	}

	restoreAllPlayerState(player: Player): void {
		this.restorePlayerInputPermissions(player);
		this.restorePlayerGameMode(player);
		this.restorePlayerHudElements(player);
		this.deletePlayerInputPermissions(player);
		this.deletePlayerGameMode(player);
		this.deletePlayerHudElements(player);
	}
}
