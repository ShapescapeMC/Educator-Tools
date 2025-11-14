import { system } from "@minecraft/server";
import { EnvironmentService } from "./environment.service";

/**
 * Mechanic that handles real-time daylight synchronization by continuously updating
 * the game time to match real-world time when the feature is enabled.
 */
export class EnvironmentMechanic {
	/**
	 * Creates a new EnvironmentMechanic instance.
	 * @param environmentService - The environment service to control world time
	 */
	constructor(private readonly environmentService: EnvironmentService) {}

	/**
	 * Initializes the mechanic by starting a tick interval that runs every game tick.
	 */
	initialize(): void {
		system.runTimeout(() => {
			system.runInterval(() => {
				this.tick();
			}, 20);
		}, Math.floor(Math.random() * 20)); // Random delay to spread load
	}

	/**
	 * Tick function called every game tick to update the world time if real-time daylight is enabled.
	 */
	tick(): void {
		if (this.environmentService.isRealTimeDaylight()) {
			const ticks = this.getRealtimeTicks();
			// Only update if the time has changed to avoid unnecessary operations
			const currentTime = this.environmentService.getDayTime();
			if (Math.abs(currentTime - ticks) > 1) {
				this.environmentService.setDayTime(ticks);
			}
		}
	}

	/**
	 * Calculates the Minecraft time ticks (0-24000) based on the current real-world time.
	 * Converts hours, minutes, and seconds into game ticks, with 6:00 AM as the starting point (tick 0).
	 * @returns The calculated time in Minecraft ticks
	 */
	private getRealtimeTicks(): number {
		const d = new Date();
		const s = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
		return Math.floor((((s - 21600 + 86400) % 86400) / 86400) * 24000);
	}
}
