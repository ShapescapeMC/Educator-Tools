import { PlayerSpawnAfterEvent, world } from "@minecraft/server";
import { PlayerNicknameService } from "./player_nickname.service";

export class PlayerNicknameMechanic {
	static readonly id = "player_nickname";
	public readonly id = PlayerNicknameMechanic.id;

	constructor(private readonly playerNicknameService: PlayerNicknameService) {}

	initialize(): void {
		world.afterEvents.playerSpawn.subscribe((event) => {
			this.onPlayerJoin(event);
		});
	}

	onPlayerJoin(event: PlayerSpawnAfterEvent): void {
		if (event.initialSpawn) {
			const player = event.player;
			const nickname = this.playerNicknameService.getNickname(player.id);
			if (nickname) {
				player.nameTag = nickname;
			} else {
				player.nameTag = player.name;
				if (this.playerNicknameService.getSettings().promptOnJoin) {
					// Prompt the player to set a nickname
				}
			}
		}
	}
}
