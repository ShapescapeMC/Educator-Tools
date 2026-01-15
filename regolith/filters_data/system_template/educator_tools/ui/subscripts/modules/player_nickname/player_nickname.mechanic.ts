import {
	Player,
	PlayerLeaveAfterEvent,
	PlayerSpawnAfterEvent,
	system,
	Vector3,
	world,
} from "@minecraft/server";
import { PlayerNicknameService } from "./player_nickname.service";
import { TeamsService } from "../teams/teams.service";
import { SceneManager } from "../scene_manager/scene-manager";
import { Vec3 } from "@bedrock-oss/bedrock-boost";

export class PlayerNicknameMechanic {
	static readonly id = "player_nickname";
	public readonly id = PlayerNicknameMechanic.id;

	private playersToPrompt: Map<string, Vector3> = new Map();

	constructor(
		private readonly playerNicknameService: PlayerNicknameService,
		private readonly teamService: TeamsService,
	) {}

	initialize(): void {
		world.afterEvents.playerSpawn.subscribe((event) => {
			this.onPlayerJoin(event);
		});
		world.afterEvents.playerLeave.subscribe((event) => {
			this.onPlayerLeave(event);
		});

		system.runInterval(() => {
			this.remindApprovalQueue();
		}, 20 * 60 * 3);

		system.runInterval(() => {
			this.checkPlayerPrompts();
		}, 20 + Math.floor(Math.random() * 20));
	}

	onPlayerJoin(event: PlayerSpawnAfterEvent): void {
		if (event.initialSpawn) {
			const player = event.player;
			const nickname = this.playerNicknameService.getNickname(player.id);
			if (nickname) {
				player.nameTag = nickname;

				if (this.playerNicknameService.getSettings().customLeaveJoinMessages) {
					world.sendMessage({
						translate: "edu_tools.ui.player_nickname_student.join_message",
						with: [nickname, player.name],
					});
				}
			} else {
				player.nameTag = player.name;
				if (this.playerNicknameService.getSettings().promptOnJoin) {
					this.playersToPrompt.set(player.id, player.getViewDirection());
				}
			}
		}
	}

	onPlayerLeave(event: PlayerLeaveAfterEvent): void {
		const playerName = event.playerName;
		const playerId = event.playerId;
		if (this.playerNicknameService.getSettings().customLeaveJoinMessages) {
			const nickname = this.playerNicknameService.getNickname(playerId);
			if (nickname) {
				world.sendMessage({
					translate: "edu_tools.ui.player_nickname_student.leave_message",
					with: [nickname, playerName],
				});
			}
		}
		this.playersToPrompt.delete(playerId);
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
				teacher.playSound("note.pling", { volume: 0.5, pitch: 1 });
			}
		});
	}

	notifyApprovalQueue(player: Player, nickname: string): void {
		if (!player || !nickname) {
			return;
		}
		const teachers =
			this.teamService.getTeam(TeamsService.TEACHERS_TEAM_ID)?.memberIds || [];
		teachers.forEach((teacherId) => {
			const teacher = world.getEntity(teacherId) as Player;
			if (teacher) {
				teacher.sendMessage({
					translate: "edu_tools.ui.player_nickname_approval.notification",
					with: [player.name, nickname],
				});
			}
		});
	}

	checkPlayerPrompts(): void {
		this.playersToPrompt.forEach((location, playerId) => {
			const player = world.getEntity(playerId) as Player;
			if (player) {
				const distance = Vec3.from(player.getViewDirection()).distance(
					location,
				);
				if (distance >= 1) {
					SceneManager.getInstance().createContextAndOpenScene(
						player,
						"player_nickname_student",
					);
				}
			}
		});
	}

	studentUIOpened(playerId: string): void {
		this.playersToPrompt.delete(playerId);
	}

	studentUIOpenFail(playerId: string): void {
		this.playersToPrompt.set(playerId, { x: 0, y: 0, z: 0 });
	}
}
