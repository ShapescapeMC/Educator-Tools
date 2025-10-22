import { Module, ModuleManager } from "../../module-manager";
import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { PropertyStorage } from "@shapescape/storage";
import { Player, world } from "@minecraft/server";
import { TeamsService } from "../teams/teams.service";
import { ClassroomLimitationsMechanic } from "./classroom-limitations.mechanic";

/**
 * ClassroomLimitationsService
 * Allows teachers to toggle restrictions on certain gameplay mechanics/items for students.
 * Items/mechanics currently supported: Ender Pearls, Eggs, Arrows, Elytra.
 *
 * Storage layout (subStorage `classroom_limitations`):
 *  - enabled_ender_pearls: boolean (true => restriction active, item blocked)
 *  - enabled_eggs
 *  - enabled_arrows
 *  - enabled_elytra
 *
 * Assumptions:
 *  - A "teacher" is any player contained in the `system_teachers` team.
 *  - Restrictions apply to all non-teacher players (students + any others not in teachers team).
 *  - Mechanics are enforced via event interception (itemUse) and periodic inventory scans.
 *  - If API events are missing in a future version, fallback relies only on inventory scans.
 */
export class ClassroomLimitationsService implements Module {
	readonly id = "classroom_limitations";

	private readonly storage: PropertyStorage;
	private readonly teamsService: TeamsService;
	private mechanic?: ClassroomLimitationsMechanic;
	private readonly item_limitations = [
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

	constructor(private readonly moduleManager: ModuleManager) {
		// Acquire sub storage
		this.storage = moduleManager.getStorage().getSubStorage(this.id);
		this.teamsService = moduleManager.getModule<TeamsService>(TeamsService.id)!;
		this.ensureDefaults();
	}

	/** Ensure default values exist */
	private ensureDefaults(): void {
		for (const l of this.item_limitations) {
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
		for (const lim of this.item_limitations) {
			if (!this.isRestrictionEnabled(lim.key)) continue;
			if (lim.itemIds.includes(typeId)) return true;
		}
		return false;
	}

	/** Determines whether a player is a teacher */
	public isTeacher(player: Player): boolean {
		return this.teamsService.isPlayerInTeam(
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
	}

	/** Expose limitation definitions for scene */
	public getItemLimitations(): { key: string; itemIds: string[] }[] {
		return this.item_limitations;
	}
}

/**
 * UI Scene for Classroom Limitations
 * Renders toggles for each restriction.
 */
class ClassroomLimitationsScene extends ModalUIScene {
	constructor(
		sceneManager: SceneManager,
		context: any,
		private service: ClassroomLimitationsService,
	) {
		super("classroom_limitations", context.getSourcePlayer(), "main");

		// Add toggles dynamically based on service definitions
		for (const lim of this.service.getItemLimitations()) {
			const translationKey = `edu_tools.ui.classroom_limitations.toggles.${lim.key}`;
			this.addToggle(
				translationKey,
				(value: boolean) => {
					this.service.setRestriction(lim.key, value);
				},
				{
					defaultValue: this.service.isRestrictionEnabled(lim.key),
					tooltip: `${translationKey}_tooltip`,
				},
			);
		}

		this.show(context.getSourcePlayer(), sceneManager).then((r) => {
			if (!r.canceled) {
				sceneManager.goBackToScene(context, "main");
			}
		});
	}
}
