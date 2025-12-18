import { system, world } from "@minecraft/server";
import { PropertyStorage, CachedStorage } from "@shapescape/storage";
import { ModuleManager } from "../../module-manager";
import { TeamsService } from "../teams/teams.service";

export interface PlayerNicknameSettings {
	promptOnJoin: boolean;
	allowCustomColors: boolean;
	requireApproval: boolean;
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
	private teamsService: TeamsService | undefined;

	constructor(private readonly moduleManager: ModuleManager) {
		this.storage = new CachedStorage(world, "player_nickname");
		this.nicknameStorage = this.storage.getSubStorage("nicknames");
		this.approvalQueueStorage = this.storage.getSubStorage("approval_queue");
	}

	initialize(): void {
		// Delay getting TeamsService until after all modules are initialized
		system.run(() => {
			this.teamsService = this.moduleManager.getModule(
				TeamsService.id,
			) as TeamsService;
		});

		system.runInterval(() => {
			this.checkIfApprovalNeeded();
		}, 20 * 60 * 5);
	}

	getNickname(playerId: string): string | undefined {
		return this.nicknameStorage.get(playerId);
	}

	setNickname(playerId: string, nickname: string): void {
		// Trim whitespace from nickname, remove color codes, limit length and remove non ascii characters
		nickname = nickname
			.trim()
			.replace(/[^\x00-\x7F]/g, "")
			.substring(0, 20);
		if (!this.getSettings().allowCustomColors) {
			nickname = nickname.replace(/§[0-9a-fk-or]/gi, "");
		}
		this.nicknameStorage.set(playerId, nickname);

        const player = world.getEntity(playerId);
        if (player) {
            player.nameTag = nickname;
        }
	}

	clearNickname(playerId: string): void {
		this.nicknameStorage.set(playerId, undefined);
	}

	clearAllNicknames(): void {
		this.nicknameStorage.clear();
	}

	getAllNicknames(): Record<string, string>[] {
		return this.nicknameStorage.getAll();
	}

	addNicknameApprovalRequest(playerId: string, nickname: string): void {
		this.approvalQueueStorage.set(playerId, nickname);
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
		}
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
			requireApproval: false,
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

		if (partialSettings.requireApproval === false) {
			this.checkIfApprovalNeeded();
		}
	}
}
