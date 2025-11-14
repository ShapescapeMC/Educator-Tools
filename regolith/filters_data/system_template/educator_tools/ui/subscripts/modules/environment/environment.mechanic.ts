import { system } from "@minecraft/server";
import { EnvironmentService } from "./environment.service";

export class EnvironmentMechanic {
	constructor(private readonly environmentService: EnvironmentService) {}

	initialize(): void {
		system.runInterval(() => {
			this.tick();
		}, 1);
	}

	tick(): void {
		if (this.environmentService.isRealTimeDaylight()) {
			const ticks = this.getRealtimeTicks();
			this.environmentService.setDayTime(ticks);
		}
	}

	private getRealtimeTicks(): number {
		const d = new Date();
		const s = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
		return Math.floor((((s - 21600 + 86400) % 86400) / 86400) * 24000);
	}
}
