import { world, system, Player } from "@minecraft/server";
import { ClassroomLimitationsService } from "./classroom-limitations.service";

/**
 * ClassroomLimitationsMechanic
 * Encapsulates runtime enforcement of classroom limitation rules.
 */
/**
 * ClassroomLimitationsMechanic
 * Uses system.runJob for inventory scanning so work is chunked safely across ticks.
 * Ensures no overlapping scans: a new job is only started once the previous job's generator finishes.
 */
export class ClassroomLimitationsMechanic {
	private scanInProgress = false;

	constructor(private readonly service: ClassroomLimitationsService) {}

	/** Start all mechanic listeners */
	public start(): void {
		this.registerItemUseInterception();
		this.scheduleInventoryScans();
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
			for (const player of players) {
				if (mechanic.service.isTeacher(player)) continue;
				const inv = player.getComponent("minecraft:inventory") as any;
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
}
