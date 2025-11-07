import { Module, ModuleManager } from "../../module-manager";
import { SceneManager } from "../scene_manager/scene-manager";
import { PropertyStorage } from "@shapescape/storage";
import { Player } from "@minecraft/server";
import { TeamsService } from "../teams/teams.service";
import { ClassroomLimitationsMechanic } from "./classroom-limitations.mechanic";
import { ClassroomLimitationsScene } from "./classroom-limitations.scene";

/**
 * ClassroomLimitationsService
 * Allows teachers to toggle restrictions on certain gameplay mechanics/items/entities for students.
 * Items/mechanics currently supported: Ender Pearls, Eggs, Arrows, Elytra, TNT, Potions, etc.
 * Entities currently supported: Wither, Snow Golem, Iron Golem, Ender Dragon, etc.
 *
 * Storage layout (subStorage `classroom_limitations`):
 *  - enabled_ender_pearls: boolean (true => restriction active, item blocked)
 *  - enabled_eggs
 *  - enabled_arrows
 *  - enabled_elytra
 *  - enabled_wither: boolean (true => wither spawning blocked)
 *  - enabled_snow_golem
 *  ... etc
 *
 * Assumptions:
 *  - A "teacher" is any player contained in the `system_teachers` team.
 *  - Restrictions apply to all non-teacher players (students + any others not in teachers team).
 *  - Mechanics are enforced via event interception (itemUse, entitySpawn) and periodic inventory scans.
 */
export class ClassroomLimitationsService implements Module {
	readonly id = "classroom_limitations";

	private readonly storage: PropertyStorage;
	private teamsService: TeamsService | undefined;
	private mechanic?: ClassroomLimitationsMechanic;
	private readonly itemLimitations = [
		{ key: "ender_pearls", itemIds: ["minecraft:ender_pearl"] },
		{ key: "eggs", itemIds: ["minecraft:egg"] },
		{ key: "arrows", itemIds: ["minecraft:arrow"] },
		{ key: "fireworks", itemIds: ["minecraft:firework_rocket"] },
		{ key: "elytra", itemIds: ["minecraft:elytra"] },
		{ key: "tnt", itemIds: ["minecraft:tnt"] },
		{ key: "dragon_egg", itemIds: ["minecraft:dragon_egg"] },
		{
			key: "potions",
			itemIds: [
				"minecraft:potion",
				"minecraft:splash_potion",
				"minecraft:lingering_potion",
				"minecraft:ominous_bottle",
			],
		},
	];

	private readonly entityLimitations = [
		{ key: "wither", entityIds: ["minecraft:wither"] },
		{ key: "snow_golem", entityIds: ["minecraft:snow_golem"] },
		{ key: "iron_golem", entityIds: ["minecraft:iron_golem"] },
		{ key: "ender_dragon", entityIds: ["minecraft:ender_dragon"] },
		{ key: "elder_guardian", entityIds: ["minecraft:elder_guardian"] },
		{ key: "warden", entityIds: ["minecraft:warden"] },
	];

	constructor(private readonly moduleManager: ModuleManager) {
		// Acquire sub storage
		this.storage = moduleManager.getStorage().getSubStorage(this.id);
		this.ensureDefaults();
	}

	/** Ensure default values exist */
	private ensureDefaults(): void {
		for (const l of this.itemLimitations) {
			const key = this.getStorageKey(l.key);
			if (this.storage.get(key) === undefined) {
				// By default restrictions disabled
				this.storage.set(key, false);
			}
		}
		for (const l of this.entityLimitations) {
			const key = this.getStorageKey(l.key);
			if (this.storage.get(key) === undefined) {
				// By default restrictions disabled
				this.storage.set(key, false);
			}
		}
	}

	/** Builds the storage key */
	private getStorageKey(key: string): string {
		return `enabled_${key}`;
	}

	/** Checks if restriction for given limitation key is enabled */
	public isRestrictionEnabled(key: string): boolean {
		return (this.storage.get(this.getStorageKey(key)) as boolean) ?? false;
	}

	/** Toggle a restriction */
	public setRestriction(key: string, value: boolean): void {
		this.storage.set(this.getStorageKey(key), value);
	}

	/** Returns true if this item typeId is currently restricted */
	public isItemRestricted(typeId: string): boolean {
		for (const lim of this.itemLimitations) {
			if (!this.isRestrictionEnabled(lim.key)) continue;
			if (lim.itemIds.includes(typeId)) return true;
		}
		return false;
	}

	/** Returns true if this entity typeId is currently restricted */
	public isEntityRestricted(typeId: string): boolean {
		for (const lim of this.entityLimitations) {
			if (!this.isRestrictionEnabled(lim.key)) continue;
			if (lim.entityIds.includes(typeId)) return true;
		}
		return false;
	}

	public isRestricted(typeId: string): boolean {
		return this.isItemRestricted(typeId) || this.isEntityRestricted(typeId);
	}

	/** Determines whether a player is a teacher */
	public isTeacher(player: Player): boolean {
		return this.teamsService!.isPlayerInTeam(
			TeamsService.TEACHERS_TEAM_ID,
			player.id,
		);
	}

	/** Scene registration */
	registerScenes(sceneManager: SceneManager): void {
		sceneManager.registerScene(
			this.id,
			(manager: SceneManager, context: any) => {
				new ClassroomLimitationsScene(manager, context, this);
			},
		);
	}

	/** Initialize mechanics */
	initialize(): void {
		this.mechanic = new ClassroomLimitationsMechanic(this);
		this.mechanic.start();
		this.teamsService = this.moduleManager.getModule<TeamsService>(
			TeamsService.id,
		)!;
	}

	public onSettingsUpdated(): void {
		if (!this.mechanic) return;
		this.mechanic.launchEntityScanJob();
	}

	/** Expose limitation definitions for scene */
	public getItemLimitations(): { key: string; itemIds: string[] }[] {
		return this.itemLimitations;
	}

	/** Expose entity limitation definitions for scene */
	public getEntityLimitations(): { key: string; entityIds: string[] }[] {
		return this.entityLimitations;
	}
}
