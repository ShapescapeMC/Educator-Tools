import {
	world,
	system,
	Player,
	Entity,
	EntityItemComponent,
	EntitySpawnAfterEvent,
	EntityLoadAfterEvent,
	EntityInventoryComponent,
	DimensionTypes,
	ItemUseBeforeEvent,
} from "@minecraft/server";
import { ClassroomLimitationsService } from "./classroom-limitations.service";

/**
 * Runtime enforcement layer for classroom limitation rules (restricted items & entities).
 *
 * Responsibilities:
 * - Intercepts item use attempts for restricted items and cancels them for non‑teacher players.
 * - Periodically scans player inventories (chunked via `system.runJob`) removing restricted items.
 * - Monitors entity spawn/load events and removes restricted entities or dropped restricted items.
 * - Provides an ad‑hoc full world entity scan via `launchEntityScanJob` using a generator for pacing.
 *
 * Design notes:
 * - Inventory scans are guarded by the `scanInProgress` flag to avoid overlapping jobs.
 * - Scan interval adds a random jitter to reduce synchronized workload spikes in multiplayer sessions.
 * - Player notifications are localized using translation keys under `edu_tools.message.classroom_limitations.*`.
 */
export class ClassroomLimitationsMechanic {
	/** Maximum distance in blocks to notify players about a blocked entity removal. */
	private static readonly NOTIFICATION_RADIUS = 5;
	/** Base interval (in ticks) between attempts to start an inventory scan job. */
	private static readonly BASE_SCAN_INTERVAL = 40;
	/** Random jitter (in ticks) added to the base interval to desynchronize scans. */
	private static readonly SCAN_INTERVAL_JITTER = 20;

	/** Flag indicating an inventory scan job is currently running and new one must not start. */
	private scanInProgress = false;

	/**
	 * Creates a new classroom limitations mechanic.
	 * @param service Service providing role checks (teacher vs student) and restriction lookups.
	 */
	constructor(private readonly service: ClassroomLimitationsService) {}

	/**
	 * Initializes all runtime listeners & periodic tasks.
	 * Call once after world load.
	 */
	public start(): void {
		this.registerItemUseInterception();
		this.scheduleInventoryScans();
		this.registerEntitySpawnInterception();
	}

	/**
	 * Subscribes to item use events and cancels usage of restricted items for non‑teacher players.
	 * Sends a feedback message when an attempt is blocked.
	 * @remarks Uses a broad `any` for the event parameter due to upstream typing variations.
	 */
	private registerItemUseInterception(): void {
		world.beforeEvents.itemUse.subscribe((ev: ItemUseBeforeEvent) => {
			const player: Player = ev.source;
			if (!player || this.service.isTeacher(player)) return;
			const item = ev.itemStack;
			if (item && this.service.isItemRestricted(item.typeId)) {
				ev.cancel = true;
				try {
					player.sendMessage({
						translate:
							"edu_tools.message.classroom_limitations.attempt_blocked",
					});
				} catch {}
			}
		});
	}

	/**
	 * Subscribes to entity spawn & load events so late‑loaded or newly created entities are checked.
	 * Restricted entities are removed immediately with nearby player notification.
	 */
	private registerEntitySpawnInterception(): void {
		world.afterEvents.entitySpawn.subscribe((ev: EntitySpawnAfterEvent) => {
			const entity: Entity = ev.entity;
			if (!entity) return;
			this.checkEntity(entity);
		});
		world.afterEvents.entityLoad.subscribe((ev: EntityLoadAfterEvent) => {
			const entity: Entity = ev.entity;
			if (!entity) return;
			this.checkEntity(entity);
		});
	}

	/**
	 * Schedules periodic inventory scan attempts. A scan only starts if no other scan job is running.
	 * Uses `system.runInterval` and applies jitter to reduce simultaneous execution across sessions.
	 */
	private scheduleInventoryScans(): void {
		// Attempt start if no scan is active.
		system.runInterval(() => {
			if (this.scanInProgress) return;
			this.launchInventoryScanJob();
		}, ClassroomLimitationsMechanic.BASE_SCAN_INTERVAL + Math.floor(Math.random() * ClassroomLimitationsMechanic.SCAN_INTERVAL_JITTER));
	}

	/**
	 * Launches a generator‑driven job that walks all player inventories slot‑by‑slot.
	 * Restricted items are removed and players notified. Work yields after each slot for pacing.
	 * @internal The completion flag is flipped before generator return ensuring subsequent scheduling.
	 */
	private launchInventoryScanJob(): void {
		this.scanInProgress = true;
		const players = world.getPlayers();

		const mechanic = this; // capture for completion flag
		function* scanGenerator(): Generator<void, void, unknown> {
			for (let player of players) {
				if (!player.isValid) {
					// Refresh player reference if invalid
					player = world.getPlayers().find((p) => p.id === player.id)!;
					if (!player) continue;
				}
				if (mechanic.service.isTeacher(player)) continue;
				const inv = player.getComponent(
					EntityInventoryComponent.componentId,
				) as EntityInventoryComponent;
				const container = inv?.container;
				if (!container) continue;
				for (let i = 0; i < container.size; i++) {
					const item = container.getItem(i);
					if (item && mechanic.service.isItemRestricted(item.typeId)) {
						container.setItem(i, undefined);
						try {
							player.sendMessage({
								translate:
									"edu_tools.message.classroom_limitations.item_removed",
								with: [item.typeId.split(":")[1]],
							});
						} catch {}
					}
					// Yield after each slot to let the job system manage pacing.
					yield;
				}
			}
			// Mark completion before final return.
			mechanic.scanInProgress = false;
		}

		try {
			system.runJob(scanGenerator());
		} catch {
			// Fallback: mark not in progress so another attempt can be made later.
			this.scanInProgress = false;
		}
	}

	/**
	 * Performs a full world entity scan across all dimensions using a generator job.
	 * Each entity is validated via `checkEntity`. Intended for manual / on‑demand audits.
	 */
	public launchEntityScanJob(): void {
		const mechanic = this;
		const dimensionTypeIds = DimensionTypes.getAll().map((d) => d.typeId);
		function* entityScanGenerator(): Generator<void, void, unknown> {
			for (const dimTypeId of dimensionTypeIds) {
				const dim = world.getDimension(dimTypeId);
				const entities = dim.getEntities({});
				for (const entity of entities) {
					mechanic.checkEntity(entity);
					yield;
				}
				yield;
			}
		}
		system.runJob(entityScanGenerator());
	}

	/**
	 * Validates a single entity against restriction rules and removes it if necessary.
	 * Notifies nearby players (within `NOTIFICATION_RADIUS`) of removal when blocked.
	 * @param entity The entity instance to check & possibly remove.
	 */
	public checkEntity(entity: Entity): void {
		let remove = false;
		// Check if it's a restricted item entity
		if (entity.typeId === "minecraft:item") {
			const itemComp = entity.getComponent(
				EntityItemComponent.componentId,
			) as EntityItemComponent;
			if (
				itemComp &&
				this.service.isItemRestricted(itemComp.itemStack.typeId)
			) {
				remove = true;
			}
		}
		// Check if the item type itself is restricted
		else if (this.service.isItemRestricted(entity.typeId)) {
			remove = true;
		}
		// Check if the entity type is restricted (e.g., wither, snow golem)
		else if (this.service.isEntityRestricted(entity.typeId)) {
			remove = true;
		}
		if (remove) {
			const dimension = entity.dimension;
			const location = entity.location;
			const nearbyPlayers = dimension.getPlayers({
				location: location,
				maxDistance: ClassroomLimitationsMechanic.NOTIFICATION_RADIUS,
			});
			for (const player of nearbyPlayers) {
				player.sendMessage({
					translate: "edu_tools.message.classroom_limitations.entity_blocked",
					with: [
						ClassroomLimitationsMechanic.toTitleCase(
							entity.typeId.split(":")[1],
						),
					],
				});
			}
			entity.remove();
		}
	}

	/**
	 * Converts a snake_case identifier to Title Case with spaces.
	 * @param str Raw snake_case string (e.g., "snow_golem").
	 * @returns Title cased version (e.g., "Snow Golem").
	 */
	private static toTitleCase(str: string): string {
		return str
			.toLowerCase()
			.split("_")
			.map((word: string) => {
				return word.charAt(0).toUpperCase() + word.slice(1);
			})
			.join(" ");
	}
}
