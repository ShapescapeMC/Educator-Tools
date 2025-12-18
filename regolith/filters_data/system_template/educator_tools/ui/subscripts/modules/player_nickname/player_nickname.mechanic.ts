import { Player, PlayerSpawnAfterEvent, world } from "@minecraft/server";
import { PlayerNicknameService } from "./player_nickname.service";
import { TeamsService } from "../teams/teams.service";
import { SceneManager } from "../scene_manager/scene-manager";

export class PlayerNicknameMechanic {
	static readonly id = "player_nickname";
	public readonly id = PlayerNicknameMechanic.id;

	constructor(
		private readonly playerNicknameService: PlayerNicknameService,
		private readonly teamService: TeamsService,
	) {}

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
					SceneManager.getInstance().createContextAndOpenScene(
						player,
						"player_nickname_student",
					);
				}
			}
		}
	}

	remindApprovalQueue(): void {
		const pendingNicknames =
			this.playerNicknameService.getNicknameApprovalRequests();
		if (pendingNicknames.length === 0) {
			return;
		}
		const teachers =
			this.teamService.getTeam(TeamsService.TEACHERS_TEAM_ID)?.memberIds || [];
		teachers.forEach((teacherId) => {
			const teacher = world.getEntity(teacherId) as Player;
			if (teacher) {
				teacher.sendMessage({
					translate: "edu_tools.ui.player_nickname_approval.reminder",
					with: [pendingNicknames.length + ""],
				});
			}
		});
	}
}
