import { Player, system, world } from "@minecraft/server";
import { TimerService } from "./timer.service";
import { SceneManager } from "../scene_manager/scene-manager";

export class TimerMechanic {
	static readonly id = "timer";

	private taskId: number | null = null;

	constructor(private readonly timerService: TimerService) {}

	initialize(): void {
		this.taskId = system.runInterval(() => {
			this.tick();
		}, 20);
		world.afterEvents.playerInteractWithEntity.subscribe((event) => {
			if (event.target.typeId === "edu_tools:timer") {
				this.onTimerClicked(event.player);
			}
		});
	}

	tick(): void {
		// First account for any inactivity (game closed) time so countdown remains fair
		this.timerService.handleInactivity();
		this.timerService.updateTimerEntity();
	}

	onTimerClicked(player: Player): void {
		const sceneManager = SceneManager.getInstance();
		sceneManager.createContextAndOpenScene(player, "timer");
	}

	stop(): void {
		if (this.taskId !== null) {
			system.clearRun(this.taskId);
			this.taskId = null;
		}
	}
}
