import { system, world } from "@minecraft/server";
import { PropertyStorage, CachedStorage } from "@shapescape/storage";
import { ModuleManager } from "../../module-manager";
import { TeamsService } from "../teams/teams.service";

export interface PlayerNicknameSettings {
	promptOnJoin: boolean;
}

export class PlayerNicknameService {
	static readonly id = "player_nickname";
	public readonly id = PlayerNicknameService.id;
	private readonly storage: PropertyStorage;
	private readonly nicknameStorage: PropertyStorage;
	private teamsService: TeamsService | undefined;

	constructor(private readonly moduleManager: ModuleManager) {
		this.storage = new CachedStorage(world, "player_nickname");
		this.nicknameStorage = this.storage.getSubStorage("nicknames");
	}

	initialize(): void {
		// Delay getting TeamsService until after all modules are initialized
		system.run(() => {
			this.teamsService = this.moduleManager.getModule(
				TeamsService.id,
			) as TeamsService;
		});
	}

	getNickname(playerId: string): string | undefined {
		return this.nicknameStorage.get(playerId);
	}

	setNickname(playerId: string, nickname: string): void {
		this.nicknameStorage.set(playerId, nickname);
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

	getSettings(): PlayerNicknameSettings {
		const defaultSettings: PlayerNicknameSettings = {
			promptOnJoin: false,
		};
		const settings = this.storage.get("settings") as
			| Partial<PlayerNicknameSettings>
			| undefined;
		return {
			promptOnJoin: settings?.promptOnJoin ?? defaultSettings.promptOnJoin,
		};
	}

	setSettings(settings: PlayerNicknameSettings): void {
		this.storage.set("settings", settings);
	}

	updateSettings(partialSettings: Partial<PlayerNicknameSettings>): void {
		const currentSettings = this.getSettings();
		const updatedSettings = { ...currentSettings, ...partialSettings };
		this.setSettings(updatedSettings);
	}
}
