import { Module, ModuleManager } from "../../module-manager";
import {
	GameMode,
	HudElement,
	HudVisibility,
	InputPermissionCategory,
	Player,
	world,
} from "@minecraft/server";
import { SceneManager } from "../scene_manager/scene-manager";
import { Team } from "../teams/interfaces/team.interface";
import { SceneContext } from "../scene_manager/scene-context";
import { ButtonConfig } from "../main/main.service";
import { CachedStorage, PropertyStorage } from "@shapescape/storage";
import { FocusModeMechanic } from "./focus_mode.mechanic";
import { TeamsService } from "../teams/teams.service";
import { PlayerStatusService } from "../player_status/player_status.service";
import { FocusModeScene } from "./focus_mode.scene";
import { FocusModeManageScene } from "./focus_mode_manage.scene";

/**
 * Service for managing player gamemodes.
 * This service allows setting gamemodes for players and teams.
 */
export class FocusModeService implements Module {
	static readonly id = "focus_mode";
	public readonly id = FocusModeService.id;
	private teamsService: TeamsService;
	private playerStatusService: PlayerStatusService;
	private readonly focusModeMechanic: FocusModeMechanic;
	private readonly storage: PropertyStorage;

	constructor(private readonly moduleManager: ModuleManager) {
		this.storage = new CachedStorage(world, "focus_mode");
		this.focusModeMechanic = new FocusModeMechanic(this);
	}

	initialize(): void {
		this.focusModeMechanic.initialize();
		this.teamsService = this.moduleManager.getModule(
			TeamsService.id,
		) as TeamsService;
		this.playerStatusService = this.moduleManager.getModule(
			PlayerStatusService.id,
		) as PlayerStatusService;
	}

	/**
	 * Registers scenes related to gamemode management.
	 * @param sceneManager - The scene manager
	 */
	registerScenes(sceneManager: SceneManager): void {
		sceneManager.registerScene(
			FocusModeScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new FocusModeScene(manager, context, this.teamsService);
			},
		);
		sceneManager.registerScene(
			FocusModeManageScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new FocusModeManageScene(manager, context);
			},
		);
	}

	getMainButton(): ButtonConfig {
		return {
			labelKey: "edu_tools.ui.main.buttons.focus_mode",
			iconPath: "textures/edu_tools/ui/icons/main/focus_mode",
			handler: (sceneManager: SceneManager, context: SceneContext) => {
				sceneManager.openSceneWithContext(context, "focus_mode", true);
			},
			weight: 70,
		};
	}

	getTeamsInFocusMode(): Team[] {
		const teamIds = this.storage.get("teams") || [];
		const teams: Team[] = [];
		for (const teamId of teamIds) {
			const team = this.teamsService.getTeam(teamId);
			if (team) {
				teams.push(team);
			}
		}
		return teams;
	}

	getTeamFocusMode(team: Team): boolean {
		const focusMode = this.storage.get(team.id);
		return !!focusMode;
	}

	setTeamFocusMode(team: Team, focusMode: boolean): void {
		if (focusMode) {
			this.storage.set(team.id, focusMode);
			this.storage.rPush("teams", team.id);
		} else {
			this.storage.drop(team.id);
			const teams = this.storage.get("teams") || [];
			const index = teams.indexOf(team.id);
			if (index > -1) {
				teams.splice(index, 1);
				this.storage.set("teams", teams);
			}
		}
	}

	setTeamsFocusModeMessage(team: Team, message?: string): void {
		const key = `focus_mode_message_${team.id}`;
		if (message && typeof message === "string") {
			this.storage.set(key, message.trim());
		} else {
			this.storage.drop(key);
		}
	}

	getTeamsFocusModeMessage(team: Team): string | undefined {
		const key = `focus_mode_message_${team.id}`;
		return this.storage.get(key);
	}

	getPlayerFocusMode(player: Player): boolean {
		const playerStorage = new PropertyStorage(player);
		const focusMode = playerStorage.get("focus_mode");
		return !!focusMode;
	}

	setPlayerFocusMode(player: Player, focusMode: boolean): void {
		const playerStorage = new PropertyStorage(player);
		playerStorage.set("focus_mode", focusMode);
	}

	canApplyFocusMode(player: Player): boolean {
		return !this.teamsService
			.getTeam("system_teachers")
			?.memberIds.includes(player.id);
	}

	applyFocusMode(player: Player): void {
		this.playerStatusService.registerHolder(player, this.id);
		if (!this.playerStatusService.hasGameModeSaved(player)) {
			this.playerStatusService.savePlayerGameMode(player);
		}
		player.setGameMode(GameMode.Spectator);
		if (!this.playerStatusService.hasInputPermissionsSaved(player)) {
			this.playerStatusService.savePlayerInputPermissions(player);
		}
		this.playerStatusService.setAllInputPermissions(player, false);
		if (!this.playerStatusService.hasHudElementsSaved(player)) {
			this.playerStatusService.savePlayerHudElements(player);
		}
		player.onScreenDisplay.hideAllExcept();
		player.camera.fade({
			fadeTime: {
				holdTime: 3,
				fadeInTime: 0.5,
				fadeOutTime: 0.5,
			},
		});
		const team = this.teamsService
			.getPlayerTeams(player.id)
			.find((t) => this.getTeamFocusMode(t));
		if (team) {
			const message = this.getTeamsFocusModeMessage(team);
			if (message) {
				player.onScreenDisplay.updateSubtitle(message);
			}
		}
		player.onScreenDisplay.setTitle(
			{ translate: "edu_tools.ui.focus_mode.screen_title" },
			{
				stayDuration: 60,
				fadeInDuration: 0,
				fadeOutDuration: 10,
			},
		);
	}

	disableFocusMode(player: Player): void {
		this.playerStatusService.deleteHolder(player, this.id);
		if (this.playerStatusService.getHolders(player).length === 0) {
			this.playerStatusService.restoreAllPlayerState(player);
		}
		this.setPlayerFocusMode(player, false);
	}

	globalDisableFocusMode(): void {
		const teams = this.getTeamsInFocusMode();
		for (const team of teams) {
			this.setTeamFocusMode(team, false);
		}
	}
}
