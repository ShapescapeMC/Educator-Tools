import { Player, system, world } from "@minecraft/server";
import { FocusModeService } from "./focus_mode.service";

export class FocusModeMechanic {
	static readonly id = "focus_mode";
	private taskId: number | null = null;
	private readonly joinedPlayers: Set<string> = new Set();

	constructor(private readonly focusModeService: FocusModeService) {}

	initialize(): void {
		this.taskId = system.runInterval(() => {
			this.tick();
		}, 20);
		world.afterEvents.playerJoin.subscribe((event) => {
			if (!this.joinedPlayers.has(event.playerId)) {
				this.joinedPlayers.add(event.playerId);
			}
		});
		world.afterEvents.playerSpawn.subscribe((event) => {
			if (this.joinedPlayers.has(event.player.id)) {
				this.onPlayerJoin(event.player);
				this.joinedPlayers.delete(event.player.id);
			}
		});
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

	onPlayerJoin(player: Player): void {
		if (this.focusModeService.getPlayerFocusMode(player)) {
			this.focusModeService.applyFocusMode(player);
		}
	}

	stop(): void {
		if (this.taskId !== null) {
			system.clearRun(this.taskId);
			this.taskId = null;
		}
	}
}
