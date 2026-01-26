import { Player, Vector3, world } from "@minecraft/server";
import { CachedStorage, PropertyStorage } from "@shapescape/storage";
import { SceneContext } from "../scene_manager/scene-context";
import { ButtonConfig } from "../main/main.service";
import { SceneManager } from "../scene_manager/scene-manager";
import { Team } from "../teams/interfaces/team.interface";
import { LockPlayerScene } from "./lock_player.scene";
import { LockPlayerConfirmScene } from "./lock_player_confirm.scene";
import { LockPlayerEditScene } from "./lock_player_edit.scene";
import { LockPlayerTeamScene } from "./lock_player_team.scene";
import { Module, ModuleManager } from "../../module-manager";
import { LockPlayerMechanic } from "./lock_player.mechanic";
import { TeamsService } from "../teams/teams.service";
import { LockPlayerTeamSettingsScene } from "./lock_player_team_settings.scene";

export interface LockSettings {
	radius: number; // The radius around the player that will be locked
	center: Vector3; // The center point of the lock, can be a Vector3
	playerBound?: string; // The UUID of the player to lock, if applicable
	teleportToCenter: boolean; // Whether to teleport the player to the center point
	showBoundaries: boolean; // Whether to show the boundaries of the locked area
	showLockMessage: boolean; // Whether to show a message when the player is locked
}

export class LockPlayerService implements Module {
	static readonly id = "lock_player";
	public readonly id = LockPlayerService.id;
	private readonly storage: PropertyStorage;
	private readonly lockStorage: PropertyStorage;
	private lockPlayerMechanic: LockPlayerMechanic;
	private teamsService: TeamsService;

	constructor(private readonly moduleManager: ModuleManager) {
		this.storage = new CachedStorage(world, "lock_player");
		this.lockStorage = this.storage.getSubStorage("locks");
		this.lockPlayerMechanic = new LockPlayerMechanic(this, this.moduleManager);
	}

	initialize(): void {
		this.teamsService = this.moduleManager.getModule(
			TeamsService.id,
		) as TeamsService;
		// Register the mechanic for this module
		this.lockPlayerMechanic.initialize();
	}

	/**
	 * Registers scenes related to lock player functionality.
	 * @param sceneManager - The scene manager
	 */
	registerScenes(sceneManager: SceneManager): void {
		sceneManager.registerScene(
			LockPlayerScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new LockPlayerScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			LockPlayerEditScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new LockPlayerEditScene(manager, context);
			},
		);
		sceneManager.registerScene(
			LockPlayerConfirmScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new LockPlayerConfirmScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			LockPlayerTeamScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new LockPlayerTeamScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			LockPlayerTeamSettingsScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new LockPlayerTeamSettingsScene(manager, context, this);
			},
		);
	}

	/**
	 * Checks if a player is a teacher (exempt from lock restrictions).
	 * @param playerId - The player ID to check
	 * @returns True if the player is a teacher
	 */
	isPlayerExempted(playerId: string): boolean {
		const playerTeams = this.teamsService.getPlayerTeams(playerId);
		return playerTeams
			.map((team) => team.id)
			.includes(TeamsService.TEACHERS_TEAM_ID);
	}

	teleportToCenter(teamId: string): void {
		const settings = this.getLockSettings(teamId);
		if (!settings) {
			return;
		}

		const team = this.teamsService.getTeam(teamId);
		if (!team || team.memberIds.length === 0) {
			return;
		}

		for (const memberId of team.memberIds) {
			const player = world.getEntity(memberId) as Player;
			if (player && !this.isPlayerExempted(player.id)) {
				player.teleport(settings.center);
				if (settings.showLockMessage) {
					player.sendMessage({
						translate:
							"edu_tools.message.lock_player_team_settings.teleport_to_center_player",
					});
				}
			}
		}
	}

	/**     * Returns the main button configuration for the lock player module.
	 * @returns ButtonConfig for the main button
	 * */
	getMainButton(): ButtonConfig {
		return {
			labelKey: "edu_tools.ui.main.buttons.lock_player",
			iconPath: "textures/edu_tools/ui/icons/main/lock_player",
			handler: (sceneManager: SceneManager, context: SceneContext) => {
				sceneManager.openSceneWithContext(context, "lock_player", false);
			},
			weight: 100,
		};
	}

	getLockSettings(teamId: string): LockSettings | undefined {
		return this.lockStorage.get(teamId) as LockSettings | undefined;
	}

	setLockSettings(teamId: string, settings: LockSettings): void {
		this.lockStorage.set(teamId, settings);
	}

	clearLockSettings(teamId: string): void {
		this.lockStorage.drop(teamId);
	}

	clearAllLocks(): void {
		this.lockStorage.clear();
	}

	getLockedTeams(): string[] {
		const allLocks = this.lockStorage.getAll();
		const keys = allLocks
			.map((record) => Object.keys(record)[0])
			.filter((key) => key !== undefined);
		return keys;
	}

	updateLockSettings(teamId: string, settings: Partial<LockSettings>): void {
		const currentSettings = this.getLockSettings(teamId) || {};
		const updatedSettings = { ...currentSettings, ...settings };
		this.lockStorage.set(teamId, updatedSettings);
	}

	confirmAction(context: SceneContext): void {
		const subjectTeam = context.getSubjectTeam()!;
		const targetTeam = context.getTargetTeam();
		const radius = context.getData("radius") || 5;
		const teleportToCenter = context.getData("teleportToCenter") || false;
		const showLockMessage = context.getData("showLockMessage") || false;
		const showBoundaries = context.getData("showBoundaries") || false;
		const mode: number = context.getData("mode") || 0;

		if (targetTeam) {
			let center: Vector3;
			let playerBound: string | undefined = undefined;
			const targetPlayer = world.getEntity(targetTeam.memberIds[0]) as Player;
			center = targetPlayer.location;
			if (mode === 1) {
				playerBound = targetPlayer.id;
			}
			this.setLockSettings(subjectTeam.id, {
				radius,
				teleportToCenter,
				showLockMessage,
				showBoundaries,
				center,
				playerBound,
			});
		} else {
			const sourcePlayer = context.getSourcePlayer();
			const center = sourcePlayer.location;
			this.updateLockSettings(subjectTeam.id, {
				radius,
				teleportToCenter,
				showLockMessage,
				showBoundaries,
				center,
			});
		}
	}
}
