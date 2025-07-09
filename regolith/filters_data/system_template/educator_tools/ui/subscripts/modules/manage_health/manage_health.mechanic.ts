import { system, world } from "@minecraft/server";
import { ManageHealthService } from "./manage_health.service";

export class ManageHealthMechanic {
	static readonly id = "manage_health";
	private taskId: number | null = null;

	constructor(private readonly manageHealthService: ManageHealthService) {}

	initialize(): void {
		this.taskId = system.runInterval(() => {
			this.tick();
		}, 1);
	}

	tick(): void {
		const players = world.getAllPlayers();
		for (const player of players) {
			const healthProperties =
				this.manageHealthService.getPlayerHealthProperties(player);
			if (healthProperties.effect_immunity) {
				// Remove all effects from the player
				this.manageHealthService.clearEffects(player);
				this.manageHealthService.checkHealthProperties(player);
			}
		}
	}

	stop(): void {
		if (this.taskId !== null) {
			system.clearRun(this.taskId);
			this.taskId = null;
		}
	}
}
