import { Player, system, world } from "@minecraft/server";
import { PropertyStorage, CachedStorage } from "@shapescape/storage";
import { ModuleManager } from "../../module-manager";
import { TeamsService } from "../teams/teams.service";
import { ItemService } from "../item/item.service";
import { PlayerNicknameApprovalScene } from "./player_nickname_approval.scene";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { PlayerNicknameEditScene } from "./player_nickname_edit.scene";
import { PlayerNicknameSettingsScene } from "./player_nickname_settings.scene";
import { PlayerNicknameStudentScene } from "./player_nickname_student.scene";
import { PlayerNicknameTeacherScene } from "./player_nickname_teacher.scene";
import { ButtonConfig } from "../main/main.service";
import { PlayerNicknameMechanic } from "./player_nickname.mechanic";

export interface PlayerNicknameSettings {
	promptOnJoin: boolean;
	allowCustomColors: boolean;
	requireApproval: boolean;
	customLeaveJoinMessages: boolean;
}

export enum ColorCode {
	Black = "§0",
	DarkBlue = "§1",
	DarkGreen = "§2",
	DarkAqua = "§3",
	DarkRed = "§4",
	DarkPurple = "§5",
	Gold = "§6",
	Gray = "§7",
	DarkGray = "§8",
	Blue = "§9",
	Green = "§a",
	Aqua = "§b",
	Red = "§c",
	LightPurple = "§d",
	Yellow = "§e",
	White = "§f",
}

export class PlayerNicknameService {
	static readonly id = "player_nickname";
	public readonly id = PlayerNicknameService.id;
	private readonly storage: PropertyStorage;
	private readonly nicknameStorage: PropertyStorage;
	private readonly approvalQueueStorage: PropertyStorage;
	private itemService: ItemService | undefined;
	private teamsService: TeamsService | undefined;
	private playerNicknameMechanic: PlayerNicknameMechanic | undefined;

	constructor(private readonly moduleManager: ModuleManager) {
		this.storage = new CachedStorage(world, "player_nickname");
		this.nicknameStorage = this.storage.getSubStorage("nicknames");
		this.approvalQueueStorage = this.storage.getSubStorage("approval_queue");
	}

	initialize(): void {
		this.teamsService = this.moduleManager.getModule(
			TeamsService.id,
		) as TeamsService;
		this.itemService = this.moduleManager.getModule(
			ItemService.id,
		) as ItemService;

		this.playerNicknameMechanic = new PlayerNicknameMechanic(
			this,
			this.teamsService!,
		);

		system.runInterval(() => {
			this.checkIfApprovalNeeded();
		}, 20 * 60 * 5);

		this.itemService?.registerScene("player_nickname_approval", {
			priority: 100,
			condition_callback: (player) => {
				const teacherTeam = this.teamsService?.getTeam(
					TeamsService.TEACHERS_TEAM_ID,
				);
				return (
					(teacherTeam?.memberIds.includes(player.id) &&
						this.checkIfShouldOpenQueue()) ||
					false
				);
			},
		});

		this.playerNicknameMechanic.initialize();
	}

	registerScenes(sceneManager: SceneManager): void {
		sceneManager.registerScene(
			PlayerNicknameApprovalScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new PlayerNicknameApprovalScene(
					manager,
					context,
					this,
					this.teamsService!,
				);
			},
		);
		sceneManager.registerScene(
			PlayerNicknameEditScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new PlayerNicknameEditScene(manager, context, this, this.teamsService!);
			},
		);
		sceneManager.registerScene(
			PlayerNicknameSettingsScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new PlayerNicknameSettingsScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			PlayerNicknameStudentScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new PlayerNicknameStudentScene(
					manager,
					context,
					this,
					this.teamsService!,
				);
			},
		);
		sceneManager.registerScene(
			PlayerNicknameTeacherScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new PlayerNicknameTeacherScene(manager, context, this);
			},
		);
	}

	getMainButton(): ButtonConfig {
		return {
			labelKey: "edu_tools.ui.main.buttons.player_nickname",
			iconPath: "textures/edu_tools/ui/icons/main/player_nickname",
			handler: (sceneManager: SceneManager, context: SceneContext) => {
				sceneManager.openSceneWithContext(
					context,
					"player_nickname_teacher",
					true,
				);
			},
			weight: 50,
		};
	}

	getNickname(playerId: string): string | undefined {
		return this.nicknameStorage.get(playerId);
	}

	setNickname(playerId: string, nickname: string | undefined): void {
		if (nickname) {
			// Trim whitespace from nickname, remove color codes, formatting codes, limit length and remove non ascii characters
			nickname = nickname
				.trim()
				// Remove non-ascii characters except for §
				.replace(/[^\x00-\x7F§]/g, "")
				// Formatting codes are §k, §l, §m, §n, §o, §r
				.replace(/§[klmno r]/gi, "")
				// Limit to 20 characters
				.substring(0, 20);
		}
		this.nicknameStorage.set(playerId, nickname);

		if (
			nickname &&
			!this.getSettings().allowCustomColors &&
			!this.teamsService!.isPlayerInTeam(
				TeamsService.TEACHERS_TEAM_ID,
				playerId,
			)
		) {
			nickname = nickname.replace(/§[0-9a-f]/gi, "");
		}

		const player = world.getEntity(playerId) as Player | undefined;
		if (player) {
			player.nameTag = nickname || player.name;
		}
	}

	clearNickname(playerId: string): void {
		this.setNickname(playerId, undefined);
	}

	clearAllNicknames(): void {
		this.nicknameStorage.clear();
	}

	getAllNicknames(): Record<string, string>[] {
		return this.nicknameStorage.getAll();
	}

	addNicknameApprovalRequest(playerId: string, nickname: string): void {
		this.approvalQueueStorage.set(playerId, nickname);
		this.setLastApprovalRequestTick(system.currentTick);
	}

	getNicknameApprovalRequests(): Record<string, string>[] {
		return this.approvalQueueStorage.getAll();
	}

	removeNicknameApprovalRequest(playerId: string): void {
		this.approvalQueueStorage.set(playerId, undefined);
	}

	approveNickname(playerId: string): void {
		const nickname = this.approvalQueueStorage.get(playerId);
		if (nickname) {
			this.setNickname(playerId, nickname);
			this.removeNicknameApprovalRequest(playerId);
		} else {
			this.clearNickname(playerId);
		}
	}

	reloadNicknames(): void {
		const allPlayers = world.getAllPlayers();
		allPlayers.forEach((player) => {
			const nickname = this.getNickname(player.id);
			if (nickname) {
				this.setNickname(player.id, nickname);
			} else {
				this.clearNickname(player.id);
			}
		});
	}

	checkIfShouldOpenQueue(): boolean {
		const pendingRequests = this.getNicknameApprovalRequests().length;
		const timeSinceLastRequest =
			system.currentTick - (this.getLastApprovalRequestTick() || 0);
		return pendingRequests > 0 && timeSinceLastRequest >= 20 * 60 * 1;
	}

	checkIfApprovalNeeded(): void {
		if (!this.getSettings().requireApproval) {
			const pendingNicknames = this.getNicknameApprovalRequests();
			pendingNicknames.forEach((request) => {
				this.approveNickname(request.playerId);
			});
		}
	}

	getSettings(): PlayerNicknameSettings {
		const defaultSettings: PlayerNicknameSettings = {
			promptOnJoin: false,
			allowCustomColors: true,
			requireApproval: true,
			customLeaveJoinMessages: false,
		};
		const settings = this.storage.get("settings") as
			| Partial<PlayerNicknameSettings>
			| undefined;
		return {
			promptOnJoin: settings?.promptOnJoin ?? defaultSettings.promptOnJoin,
			allowCustomColors:
				settings?.allowCustomColors ?? defaultSettings.allowCustomColors,
			requireApproval:
				settings?.requireApproval ?? defaultSettings.requireApproval,
			customLeaveJoinMessages:
				settings?.customLeaveJoinMessages ??
				defaultSettings.customLeaveJoinMessages,
		};
	}

	setSettings(settings: PlayerNicknameSettings): void {
		this.storage.set("settings", settings);

		this.checkIfApprovalNeeded();
	}

	updateSettings(partialSettings: Partial<PlayerNicknameSettings>): void {
		const currentSettings = this.getSettings();
		const updatedSettings = { ...currentSettings, ...partialSettings };

		this.setSettings(updatedSettings);

		if (
			currentSettings.allowCustomColors !== updatedSettings.allowCustomColors
		) {
			this.reloadNicknames();
		}

		if (partialSettings.requireApproval === false) {
			this.checkIfApprovalNeeded();
		}
	}

	setLastApprovalRequestTick(tick: number): void {
		this.storage.set("last_approval_request", tick);
	}

	getLastApprovalRequestTick(): number | undefined {
		return this.storage.get("last_approval_request") as number | undefined;
	}

	getPlayerNicknameMechanic(): PlayerNicknameMechanic {
		return this.playerNicknameMechanic;
	}
}
