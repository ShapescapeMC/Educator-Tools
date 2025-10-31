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
} from "@minecraft/server";
import { ClassroomLimitationsService } from "./classroom-limitations.service";

/**
 * ClassroomLimitationsMechanic
 * Encapsulates runtime enforcement of classroom limitation rules for items and entities.
 * Uses system.runJob for inventory scanning so work is chunked safely across ticks.
 * Ensures no overlapping scans: a new job is only started once the previous job's generator finishes.
 */
export class ClassroomLimitationsMechanic {
	/** Maximum distance in blocks to notify players about blocked entities */
	private static readonly NOTIFICATION_RADIUS = 5;

	private scanInProgress = false;

	constructor(private readonly service: ClassroomLimitationsService) {}

	/** Start all mechanic listeners */
	public start(): void {
		this.registerItemUseInterception();
		this.scheduleInventoryScans();
		this.registerEntitySpawnInterception();
	}

	/** Intercept restricted item usage (ender pearls, eggs, etc.) */
	private registerItemUseInterception(): void {
		world.beforeEvents.itemUse.subscribe((ev: any) => {
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

	/** Set up periodic attempts to launch an inventory scan job */
	private scheduleInventoryScans(): void {
		// Every 40 ticks attempt to start a job if none running.
		system.runInterval(() => {
			if (this.scanInProgress) return;
			this.launchInventoryScanJob();
		}, 40 + Math.floor(Math.random() * 20));
	}

	/** Launch job using generator for incremental work */
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

	private static toTitleCase(str: string): string {
		return str
			.toLowerCase()
			.split("_")
			.map((word: any) => {
				return word.charAt(0).toUpperCase() + word.slice(1);
			})
			.join(" ");
	}
}
