import {
	Player,
	PlayerLeaveAfterEvent,
	PlayerSpawnAfterEvent,
	system,
	Vector3,
	world,
} from "@minecraft/server";
import { PlayerNicknameService } from "./player_nickname.service.ts";
import { TeamsService } from "../teams/teams.service.ts";
import { SceneManager } from "../scene_manager/scene-manager.ts";
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

		system.runInterval(
			() => {
				this.remindApprovalQueue();
			},
			20 * 60 * 3,
		);

		system.runInterval(
			() => {
				this.checkPlayerPrompts();
			},
			20 + Math.floor(Math.random() * 20),
		);
	}

	onPlayerJoin(event: PlayerSpawnAfterEvent): void {
		if (event.initialSpawn) {
			const settings = this.playerNicknameService.getSettings();
			if (!settings.nicknamesEnabled) {
				return;
			}
			const player = event.player;
			const nickname = this.playerNicknameService.getNickname(player.id);
			if (nickname) {
				player.nameTag = nickname;

				if (settings.customLeaveJoinMessages) {
					world.sendMessage({
						translate: "edu_tools.ui.player_nickname_student.join_message",
						with: [nickname, player.name],
					});
				}
			} else {
				player.nameTag = player.name;
				if (this.playerNicknameService.getSettings().promptOnJoin) {
					this.startStudentUIPrompt(player);
				}
			}
		}
	}

	onPlayerLeave(event: PlayerLeaveAfterEvent): void {
		const settings = this.playerNicknameService.getSettings();
		if (!settings.nicknamesEnabled) {
			return;
		}
		const playerName = event.playerName;
		const playerId = event.playerId;
		if (settings.customLeaveJoinMessages) {
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
		const settings = this.playerNicknameService.getSettings();
		if (!settings.nicknamesEnabled) {
			return;
		}
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
		const settings = this.playerNicknameService.getSettings();
		if (!settings.nicknamesEnabled) {
			return;
		}
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
		const settings = this.playerNicknameService.getSettings();
		if (!settings.nicknamesEnabled) {
			return;
		}
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

	notifyNicknameApproved(player: Player, nickname: string): void {
		if (!player || !nickname) {
			return;
		}
		player.sendMessage({
			translate: "edu_tools.ui.player_nickname_approval.response.approved",
			with: [nickname],
		});
	}

	notifyNicknameDenied(player: Player, nickname: string): void {
		if (!player || !nickname) {
			return;
		}
		player.sendMessage({
			translate: "edu_tools.ui.player_nickname_approval.response.denied",
			with: [nickname],
		});
	}

	notifyNicknameQueueProcessed(player: Player): void {
		if (!player) {
			return;
		}
		player.sendMessage({
			translate: "edu_tools.ui.player_nickname_approval.queue_processed",
		});
	}

	notifyNicknameQueueSubmitted(player: Player, nickname: string): void {
		if (!player || !nickname) {
			return;
		}
		player.sendMessage({
			translate: "edu_tools.ui.player_nickname_approval.added_to_queue",
			with: [nickname],
		});
	}

	notifyNicknameChanged(player: Player, nickname: string): void {
		if (!player || !nickname) {
			return;
		}
		player.sendMessage({
			translate: "edu_tools.ui.player_nickname_approval.changed_nickname",
			with: [nickname],
		});
	}

	studentUIOpened(playerId: string): void {
		this.playersToPrompt.delete(playerId);
	}

	restartStudentUIPrompt(playerId: string): void {
		this.playersToPrompt.set(playerId, { x: 0, y: 0, z: 0 });
	}

	startStudentUIPrompt(player: Player): void {
		this.playersToPrompt.set(player.id, player.getViewDirection());
	}
}
