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
	EntityComponentTypes,
	EntityEquippableComponent,
	EquipmentSlot,
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

	constructor(private readonly service: ClassroomLimitationsService) {}

	/**
	 * Initializes all runtime listeners & periodic tasks.
	 * Call once after world load.
	 */
	public start(): void {
		this.registerItemUseInterception();
		this.registerEntitySpawnInterception();
		this.scheduleInventoryScans();
	}

	private registerItemUseInterception(): void {
		world.beforeEvents.itemUse.subscribe((ev: ItemUseBeforeEvent) => {
			const player: Player = ev.source;
			if (!player || this.service.isTeacher(player)) return;
			const item = ev.itemStack;
			if (item && this.service.isItemRestricted(item.typeId)) {
				ev.cancel = true;
				this.notifyPlayer(
					player,
					"edu_tools.message.classroom_limitations.attempt_blocked",
				);
			}
		});
	}

	private registerEntitySpawnInterception(): void {
		const checkAndHandle = (entity: Entity) => {
			if (entity) this.checkEntity(entity);
		};
		world.afterEvents.entitySpawn.subscribe((ev: EntitySpawnAfterEvent) =>
			checkAndHandle(ev.entity),
		);
		world.afterEvents.entityLoad.subscribe((ev: EntityLoadAfterEvent) =>
			checkAndHandle(ev.entity),
		);
	}

	private scheduleInventoryScans(): void {
		system.runInterval(() => {
			if (!this.scanInProgress) this.launchInventoryScanJob();
		}, ClassroomLimitationsMechanic.BASE_SCAN_INTERVAL + Math.floor(Math.random() * ClassroomLimitationsMechanic.SCAN_INTERVAL_JITTER));
	}

	private launchInventoryScanJob(): void {
		this.scanInProgress = true;
		const players = world.getPlayers();
		const mechanic = this;

		function* scanGenerator(): Generator<void, void, unknown> {
			for (let player of players) {
				if (!player.isValid) {
					player = world.getPlayers().find((p) => p.id === player.id)!;
					if (!player) continue;
				}
				if (mechanic.service.isTeacher(player)) continue;

				mechanic.scanPlayerInventory(player);
				mechanic.scanPlayerEquipment(player);
			}
			mechanic.scanInProgress = false;
		}

		try {
			system.runJob(scanGenerator());
		} catch {
			this.scanInProgress = false;
		}
	}

	private scanPlayerEquipment(player: Player): void {
		const equipmentInv = player.getComponent(
			EntityComponentTypes.Equippable,
		) as EntityEquippableComponent;
		if (!equipmentInv) return;

		for (const slotKey in EquipmentSlot) {
			const slot = EquipmentSlot[slotKey as keyof typeof EquipmentSlot];
			const item = equipmentInv.getEquipment(slot);
			if (item && this.service.isItemRestricted(item.typeId)) {
				equipmentInv.setEquipment(slot, undefined);
				this.notifyPlayer(
					player,
					"edu_tools.message.classroom_limitations.item_removed",
					[item.typeId.split(":")[1]],
				);
			}
		}
	}

	private scanPlayerInventory(player: Player): void {
		const inv = player.getComponent(
			EntityInventoryComponent.componentId,
		) as EntityInventoryComponent;
		const container = inv?.container;
		if (!container) return;

		for (let i = 0; i < container.size; i++) {
			const item = container.getItem(i);
			if (item && this.service.isItemRestricted(item.typeId)) {
				container.setItem(i, undefined);
				this.notifyPlayer(
					player,
					"edu_tools.message.classroom_limitations.item_removed",
					[item.typeId.split(":")[1]],
				);
			}
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
			}
		}
		system.runJob(entityScanGenerator());
	}

	public checkEntity(entity: Entity): void {
		let isRestricted = false;

		if (entity.typeId === "minecraft:item") {
			const itemComp = entity.getComponent(
				EntityItemComponent.componentId,
			) as EntityItemComponent;
			isRestricted =
				itemComp && this.service.isItemRestricted(itemComp.itemStack.typeId);
		} else {
			isRestricted =
				this.service.isItemRestricted(entity.typeId) ||
				this.service.isEntityRestricted(entity.typeId);
		}

		if (isRestricted) {
			this.notifyNearbyPlayers(
				entity,
				"edu_tools.message.classroom_limitations.entity_blocked",
				[ClassroomLimitationsMechanic.toTitleCase(entity.typeId.split(":")[1])],
			);
			entity.remove();
		}
	}

	private notifyPlayer(
		player: Player,
		translationKey: string,
		params?: string[],
	): void {
		try {
			player.sendMessage({
				translate: translationKey,
				with: params,
			});
		} catch {}
	}

	private notifyNearbyPlayers(
		entity: Entity,
		translationKey: string,
		params: string[],
	): void {
		const nearbyPlayers = entity.dimension.getPlayers({
			location: entity.location,
			maxDistance: ClassroomLimitationsMechanic.NOTIFICATION_RADIUS,
		});
		for (const player of nearbyPlayers) {
			this.notifyPlayer(player, translationKey, params);
		}
	}

	private static toTitleCase(str: string): string {
		return str
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}
}
