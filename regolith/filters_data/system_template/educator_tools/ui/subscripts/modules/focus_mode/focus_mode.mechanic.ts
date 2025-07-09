import { system, world } from "@minecraft/server";
import { FocusModeService } from "./focus_mode.service";

export class FocusModeMechanic {
	static readonly id = "focus_mode";
	private taskId: number | null = null;

	constructor(private readonly focusModeService: FocusModeService) {}

	initialize(): void {
		this.taskId = system.runInterval(() => {
			this.tick();
		}, 20);
	}

	tick(): void {
		const players = world.getAllPlayers();
		const teams = this.focusModeService.getTeamsInFocusMode();
		for (const player of players) {
			const playerFocusMode = this.focusModeService.getPlayerFocusMode(player);
			const teamFocusMode = teams.some((team) =>
				team.memberIds.includes(player.id),
			);
			// Check if the player is in focus mode
			if (teamFocusMode && this.focusModeService.canApplyFocusMode(player)) {
				if (!playerFocusMode) {
					this.focusModeService.setPlayerFocusMode(player, true);
				}
				this.focusModeService.applyFocusMode(player);
			} else {
				if (playerFocusMode) {
					this.focusModeService.disableFocusMode(player);
				}
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
