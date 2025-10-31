import { system, world } from "@minecraft/server";
import { TimerService } from "./timer.service";

export class TimerMechanic {
	static readonly id = "timer";

	private taskId: number | null = null;

	constructor(private readonly timerService: TimerService) {}

	initialize(): void {
		this.taskId = system.runInterval(() => {
			this.tick();
		}, 20);
	}

	tick(): void {
		// First account for any inactivity (game closed) time so countdown remains fair
		this.timerService.handleInactivity();
		this.timerService.updateTimerEntity();
	}

	stop(): void {
		if (this.taskId !== null) {
			system.clearRun(this.taskId);
			this.taskId = null;
		}
	}
}
