import { Module } from "../../module-manager";
import {
	EntityHealthComponent,
	GameMode,
	Player,
	world,
} from "@minecraft/server";
import { SceneManager } from "../scene_manager/scene-manager";
import { Team } from "../teams/interfaces/team.interface";
import { SceneContext } from "../scene_manager/scene-context";
import { ButtonConfig } from "../main/main.service";
import { PropertyStorage } from "@shapescape/storage";
import { ManageHealthMechanic } from "./manage_health.mechanic";
import { ManageHealthScene } from "./manage_health.scene";
import { ManageHealthSettingsScene } from "./manage_health_settings.scene";

export interface HealthProperties {
	health: boolean;
	hunger: boolean;
	effect_immunity: boolean;
}

/**
 * Service for managing player gamemodes.
 * This service allows setting gamemodes for players and teams.
 */
export class ManageHealthService implements Module {
	static readonly id = "manage_health";
	public readonly id = ManageHealthService.id;
	private readonly manageHealthMechanic: ManageHealthMechanic;

	constructor() {
		this.manageHealthMechanic = new ManageHealthMechanic(this);
	}

	initialize(): void {
		this.manageHealthMechanic.initialize();
	}

	/**
	 * Registers scenes related to gamemode management.
	 * @param sceneManager - The scene manager
	 */
	registerScenes(sceneManager: SceneManager): void {
		sceneManager.registerScene(
			ManageHealthScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new ManageHealthScene(manager, context);
			},
		);
		sceneManager.registerScene(
			ManageHealthSettingsScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new ManageHealthSettingsScene(manager, context);
			},
		);
	}

	getMainButton(): ButtonConfig {
		return {
			labelKey: "edu_tools.ui.main.buttons.manage_health",
			iconPath: "textures/edu_tools/ui/icons/main/manage_health",
			handler: (sceneManager: SceneManager, context: SceneContext) => {
				context.setSubjectTeamRequired(true);
				context.setNextScene("manage_health");
				context.setData("team_filter", (team: Team): boolean => {
					if (team.memberIds.length < 1) {
						return false; // Skip empty teams
					}
					for (const memberId of team.memberIds) {
						const player = world.getEntity(memberId) as Player;
						if (!!player) return true; // Include teams with at least one online player
					}
					return false;
				});
				sceneManager.openSceneWithContext(context, "team_select", false);
			},
			weight: 60,
		};
	}

	getPlayerHealthProperties(player: Player): HealthProperties {
		const playerStorage = new PropertyStorage(player);
		return playerStorage.get("health_properties", true, {
			health: true,
			hunger: true,
			effect_immunity: false,
		});
	}

	getTeamHealthProperties(team: Team): HealthProperties {
		const properties: HealthProperties = {
			health: true,
			hunger: true,
			effect_immunity: true,
		};
		for (const memberId of team.memberIds) {
			const player = world.getEntity(memberId) as Player;
			if (player) {
				const playerProperties = this.getPlayerHealthProperties(player);
				properties.health = properties.health && playerProperties.health;
				properties.hunger = properties.hunger && playerProperties.hunger;
				properties.effect_immunity =
					properties.effect_immunity && playerProperties.effect_immunity;
			}
			if (
				properties.health === false &&
				properties.hunger === false &&
				properties.effect_immunity === false
			) {
				break; // No need to check further if all properties are false
			}
		}
		return properties;
	}

	resetProperties(team: Team): void {
		if (!team) return;
		// For each member ID in the team
		team.memberIds.forEach((playerId) => {
			const player = world.getEntity(playerId) as Player | undefined;
			// Skip if player is not found
			if (!player) {
				return;
			}
			// Reset health properties for the player
			this.setPlayerHealthProperties(player, {
				health: true,
				hunger: true,
				effect_immunity: false,
			});
			// Cure the player
			this.curePlayer(player);
		});
	}

	/**
	 * Cures a team by applying health properties to all members.
	 * @param team - The team to cure
	 */
	cureTeam(team: Team): void {
		if (!team) return;
		// For each member ID in the team
		team.memberIds.forEach((playerId) => {
			const player = world.getEntity(playerId) as Player | undefined;
			// Skip if player is not found
			if (!player) {
				return;
			}
			// Cure the player
			this.curePlayer(player);
		});
	}

	clearTeamEffects(team: Team): void {
		if (!team) return;
		// For each member ID in the team
		team.memberIds.forEach((playerId) => {
			const player = world.getEntity(playerId) as Player | undefined;
			// Skip if player is not found
			if (!player) {
				return;
			}
			// Clear effects for the player
			this.clearEffects(player);
		});
	}

	setPlayerHealthProperties(
		player: Player,
		properties: Partial<HealthProperties>,
	): void {
		const currentProperties = this.getPlayerHealthProperties(player);
		const newProperties: HealthProperties = {
			health: properties.health ?? currentProperties.health,
			hunger: properties.hunger ?? currentProperties.hunger,
			effect_immunity:
				properties.effect_immunity ?? currentProperties.effect_immunity,
		};
		this.applyHealthProperties(player, newProperties);
	}

	/**
	 * Sets health properties for a team.
	 * @param team - The team to set properties for
	 * @param properties - The health properties to set
	 */
	setTeamHealthProperties(
		team: Team,
		properties: Partial<HealthProperties>,
	): void {
		if (!team) return;
		// For each member ID in the team
		team.memberIds.forEach((playerId) => {
			const player = world.getEntity(playerId) as Player | undefined;
			// Skip if player is not found
			if (!player) {
				return;
			}
			// Set health properties for the player
			this.setPlayerHealthProperties(player, properties);
		});
	}

	/**
	 * Applies health properties to a player.
	 * @param player - The player to apply properties to
	 * @param properties - The health properties to apply
	 */
	private applyHealthProperties(
		player: Player,
		properties: HealthProperties,
	): void {
		const playerStorage = new PropertyStorage(player);
		playerStorage.set("health_properties", properties);
		if (!properties.health) {
			player.addEffect("minecraft:regeneration", 20000000, {
				amplifier: 100,
				showParticles: false,
			});
		} else {
			const effect = player.getEffect("minecraft:regeneration");
			if (effect && effect.duration > 10000000) {
				player.removeEffect(effect.typeId);
			}
		}
		if (!properties.hunger) {
			player.addEffect("minecraft:saturation", 20000000, {
				amplifier: 100,
				showParticles: false,
			});
		} else {
			const effect = player.getEffect("minecraft:saturation");
			if (effect && effect.duration > 10000000) {
				player.removeEffect(effect.typeId);
			}
		}
	}

	private curePlayer(player: Player): void {
		this.clearEffects(player);
		player.addEffect("minecraft:saturation", 5, {
			amplifier: 100,
			showParticles: false,
		});
		this.checkHealthProperties(player);
		const healthComponent = player.getComponent(
			EntityHealthComponent.componentId,
		) as EntityHealthComponent;
		if (healthComponent) {
			healthComponent.resetToMaxValue();
		}
	}

	clearEffects(player: Player): void {
		player.getEffects().forEach((effect) => {
			player.removeEffect(effect.typeId);
		});
	}

	checkHealthProperties(player: Player) {
		this.applyHealthProperties(player, this.getPlayerHealthProperties(player));
	}
}
