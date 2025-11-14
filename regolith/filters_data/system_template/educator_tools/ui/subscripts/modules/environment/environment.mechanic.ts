import { system, world } from "@minecraft/server";
import { EnvironmentService } from "./environment.service";

/**
 * Mechanic that handles real-time daylight synchronization and smooth time transitions.
 * Continuously updates the game time to match real-world time when real-time daylight is enabled,
 * and gradually transitions to target times when smooth transitions are active.
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
		system.runInterval(() => {
			this.tick();
		}, 1); // Run every tick for smooth transitions
	}

	/**
	 * Tick function called every game tick to update the world time.
	 * Handles both real-time daylight synchronization and smooth time transitions.
	 */
	tick(): void {
		// Priority 1: Handle smooth time transitions
		if (this.environmentService.hasTimeTransitionTarget()) {
			this.handleSmoothTransition();
			return; // Exit early to avoid conflicting with real-time daylight
		}

		// Priority 2: Handle real-time daylight
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
	 * Handles smooth time transitions by gradually moving towards the target time.
	 * Always moves forward (adding ticks), wrapping around at 24000 when necessary.
	 * For example, going from 20 to 10 will add ticks: 20 -> ... -> 24000 -> 0 -> ... -> 10
	 */
	private handleSmoothTransition(): void {
		const target = this.environmentService.getDayTimeTarget();
		const current = this.environmentService.getDayTime();
		const speed = this.environmentService.getTimeTransitionSpeed();

		// Calculate forward distance (always positive, wrapping at 24000)
		let forwardDistance = (target - current + 24000) % 24000;

		// Check if we've reached the target (within tolerance)
		if (forwardDistance <= speed) {
			// We're close enough, set to exact target and clear it
			this.environmentService.setDayTimeImmediate(target);
			this.environmentService.clearDayTimeTarget();
			return;
		}

		// Always move forward by speed amount
		const newTime = (current + speed) % 24000;
		this.environmentService.setDayTimeImmediate(newTime);
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
