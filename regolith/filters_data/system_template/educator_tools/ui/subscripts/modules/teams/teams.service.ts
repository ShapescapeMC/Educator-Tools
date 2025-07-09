import { PropertyStorage } from "@shapescape/storage";
import { Module } from "../../module-manager";
import { world, Player, PlayerSpawnAfterEvent } from "@minecraft/server";
import { Team, TeamsData } from "./interfaces/team.interface";
import { SceneManager } from "../scene_manager/scene-manager";
import { TeamSelectScene } from "./team-select.scene";
import { SceneContext } from "../scene_manager/scene-context";
import { TeamsDeleteScene } from "./team-delete.scene";
import { TeamsEditScene } from "./teams-edit.scene";
import { TeamsManagementScene } from "./teams-management.scene";
import { ButtonConfig } from "../main/main.service";

/**
 * Service for managing player teams.
 * This service allows creating and managing teams, even when players are offline.
 */
export class TeamsService implements Module {
	public static readonly id = "teams";
	private readonly storage: PropertyStorage;
	public readonly id = TeamsService.id;
	public static readonly ALL_PLAYERS_TEAM_ID = "system_all_players";
	private static readonly PLAYER_TEAM_PREFIX = "system_player_";
	public static readonly TEACHERS_TEAM_ID = "system_teachers";
	public static readonly STUDENTS_TEAM_ID = "system_students";

	public static readonly availableIcons = [
		"star",
		"heart",
		"diamond",
		"circle",
		"square",
	];

	constructor(storage: PropertyStorage) {
		this.storage = storage.getSubStorage(TeamsService.id);
	}

	registerScenes(sceneManager: SceneManager): void {
		sceneManager.registerScene(
			TeamSelectScene.id,
			(manager: SceneManager, context: SceneContext) => {
				// Create a new instance of MainScene
				new TeamSelectScene(manager, context);
			},
		);
		sceneManager.registerScene(
			TeamsManagementScene.id,
			(manager: SceneManager, context: SceneContext) => {
				// Create a new instance of MainScene
				new TeamsManagementScene(manager, context);
			},
		);
		sceneManager.registerScene(
			TeamsEditScene.id,
			(manager: SceneManager, context: SceneContext) => {
				// Create a new instance of MainScene
				new TeamsEditScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			TeamsDeleteScene.id,
			(manager: SceneManager, context: SceneContext) => {
				// Create a new instance of MainScene
				new TeamsDeleteScene(manager, context, this);
			},
		);
	}

	getMainButton(): ButtonConfig {
		return {
			labelKey: "edu_tools.ui.main.buttons.teams_management",
			iconPath: "textures/edu_tools/ui/icons/main/teams_management",
			handler: (sceneManager: SceneManager, context: SceneContext) => {
				sceneManager.openSceneWithContext(context, "teams_management", true);
			},
			weight: 150,
		};
	}

	initialize(): void {
		world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent) => {
			this.onPlayerSpawn(event);
		});
	}

	private onPlayerSpawn(event: PlayerSpawnAfterEvent): void {
		if (world.getAllPlayers().length === 1) {
			for (const team of this.getAllTeams()) {
				if (team.host_auto_assign) {
					// If the team is set to auto-assign and has no members, add the player
					this.addPlayerToTeam(team.id, event.player.id);
				}
			}
		}
	}

	/**
	 * Creates a new team.
	 * @param teamId - Unique identifier for the team
	 * @param name - Display name for the team
	 * @param options - Additional team options like color and description
	 * @returns The created team
	 * @throws Error if team with the same ID already exists or if trying to create a system team
	 */
	createTeam(
		teamId: string,
		name: string,
		options: {
			color?: string;
			icon?: string;
			description?: string;
			editable?: boolean;
		} = {},
	): Team {
		if (this.getTeam(teamId)) {
			throw new Error(`Team with ID '${teamId}' already exists`);
		}
		if (teamId.startsWith("system_")) {
			throw new Error(
				`Cannot create team with ID '${teamId}' - reserved prefix`,
			);
		}
		const newTeam: Team = {
			id: teamId,
			name,
			color: options.color,
			description: options.description,
			memberIds: [],
			editable: options.editable !== undefined ? options.editable : true,
			isSystem: false,
			icon: options.icon || "default_icon",
		};
		this.storage.set(teamId, newTeam);
		return newTeam;
	}

	/**
	 * Deletes a team.
	 * @param teamId - ID of the team to delete
	 * @returns True if team was deleted, false if team wasn't found
	 * @throws Error if trying to delete a system team or a non-editable team
	 */
	deleteTeam(teamId: string): boolean {
		if (this.isSystemTeam(teamId)) {
			throw new Error(`Cannot delete system team '${teamId}'`);
		}
		const team = this.getTeam(teamId);
		if (!team) {
			return false;
		}
		if (team.editable === false) {
			throw new Error(`Team '${teamId}' is not editable`);
		}
		this.storage.drop(teamId);
		return true;
	}

	/**
	 * Adds a player to a team.
	 * @param teamId - ID of the team
	 * @param playerId - ID of the player
	 * @returns True if player was added, false if player was already in the team
	 * @throws Error if team doesn't exist or is not editable, or if minimum members requirement is not met
	 */
	addPlayerToTeam(teamId: string, playerId: string): boolean {
		const team = this.getTeam(teamId);
		if (!team) {
			throw new Error(`Team with ID '${teamId}' doesn't exist`);
		}
		if (team.editable === false) {
			throw new Error(`Team '${teamId}' is not editable`);
		}
		if (team.memberIds.includes(playerId)) {
			return false;
		}
		if (team.maximumMembers && team.memberIds.length >= team.maximumMembers) {
			throw new Error(
				`Cannot add player to team '${teamId}' - maximum members limit reached`,
			);
		}
		team.memberIds.push(playerId);
		this.storage.set(teamId, team);
		return true;
	}

	/**
	 * Removes a player from a team.
	 * @param teamId - ID of the team
	 * @param playerId - ID of the player
	 * @returns True if player was removed, false if player wasn't in the team
	 * @throws Error if team is not editable or minimum members requirement is not met
	 */
	removePlayerFromTeam(teamId: string, playerId: string): boolean {
		const team = this.getTeam(teamId);
		if (!team) {
			throw new Error(`Team with ID '${teamId}' doesn't exist`);
		}
		if (team.editable === false) {
			throw new Error(`Team '${teamId}' is not editable`);
		}
		const memberIndex = team.memberIds.indexOf(playerId);
		if (memberIndex === -1) {
			return false;
		}
		if (team.minimumMembers && team.memberIds.length <= team.minimumMembers) {
			throw new Error(
				`Cannot remove player from team '${teamId}' - minimum members requirement not met`,
			);
		}
		team.memberIds.splice(memberIndex, 1);
		this.storage.set(teamId, team);
		return true;
	}

	/**
	 * Gets a team by its ID.
	 * @param teamId - ID of the team
	 * @returns The team object or null if not found
	 */
	getTeam(teamId: string): Team | undefined {
		if (teamId === TeamsService.ALL_PLAYERS_TEAM_ID) {
			return this.generateAllPlayersTeam();
		} else if (teamId === TeamsService.TEACHERS_TEAM_ID) {
			return this.generateTeachersTeam();
		} else if (teamId === TeamsService.STUDENTS_TEAM_ID) {
			return this.generateStudentsTeam();
		} else if (teamId.startsWith(TeamsService.PLAYER_TEAM_PREFIX)) {
			const playerId = teamId.replace(TeamsService.PLAYER_TEAM_PREFIX, "");
			return this.generatePlayerTeam(playerId);
		}
		const team = this.storage.get(teamId) as Team | undefined;
		return team;
	}

	/**
	 * Gets all teams.
	 * @returns Array of all teams (stored and system teams)
	 */
	getAllTeams(): Team[] {
		const systemTeams = this.getSystemTeams();
		const storedTeams = this.getAllTeamsData();
		return [...systemTeams, ...storedTeams];
	}

	/**
	 * Gets all system-generated teams.
	 * @returns Array of system-generated teams
	 */
	public getSystemTeams(): Team[] {
		const systemTeams: Team[] = [];
		const onlinePlayers = world.getAllPlayers();
		// Add All Players team
		systemTeams.push(this.generateAllPlayersTeam());
		// Add Teachers team
		systemTeams.push(this.generateTeachersTeam());
		// Add Students team
		systemTeams.push(this.generateStudentsTeam());
		// Add individual player teams
		for (const player of onlinePlayers) {
			const team = this.generatePlayerTeam(player.id);
			if (team) {
				systemTeams.push(team);
			}
		}
		return systemTeams;
	}

	/**
	 * Generates the "All Players" team on demand.
	 * @returns The All Players team
	 */
	private generateAllPlayersTeam(): Team {
		const onlinePlayers = world.getAllPlayers();
		const playerIds = onlinePlayers.map((player) => player.id);

		return {
			id: TeamsService.ALL_PLAYERS_TEAM_ID,
			name: "All Players",
			description: "All currently online players",
			memberIds: playerIds,
			isSystem: true,
			editable: false,
			icon: "all_players_icon",
		};
	}

	/**
	 * Generates an individual player team on demand.
	 * @param playerId - ID of the player
	 * @returns The player's individual team or null if player not found
	 */
	private generatePlayerTeam(playerId: string): Team | undefined {
		const player = world.getEntity(playerId) as Player | undefined;

		const existingTeam = this.storage.get(
			`${TeamsService.PLAYER_TEAM_PREFIX}${playerId}`,
		) as Team | undefined;
		let team: Team | undefined = undefined;
		if (player) {
			team = {
				id: `${TeamsService.PLAYER_TEAM_PREFIX}${playerId}`,
				name: player.name,
				description: `Individual team for ${player.name}`,
				memberIds: [playerId],
				isSystem: true,
				editable: false,
				icon: "player_icon",
				maximumMembers: 1, // Individual teams can only have one member
				minimumMembers: 1, // At least one member required
			};
			if (
				!existingTeam ||
				this.getTeamHash(team) !== this.getTeamHash(existingTeam)
			) {
				this.storage.set(team.id, team);
			}
		}
		return team;
	}

	private getTeamHash(team: Team): string {
		return `${team.id}-${team.name}-${team.description}-${team.icon}`;
	}

	/**
	 * Generates the Teachers team on demand.
	 * @returns The Teachers team
	 */
	private generateTeachersTeam(): Team {
		let team = this.storage.get(TeamsService.TEACHERS_TEAM_ID) as
			| Team
			| undefined;
		if (!team) {
			team = {
				id: TeamsService.TEACHERS_TEAM_ID,
				name: "Teachers",
				description: "All teacher players (manually assigned)",
				memberIds: [],
				isSystem: true,
				editable: true,
				icon: "teacher_icon",
				minimumMembers: 1, // At least one teacher required
				host_auto_assign: true, // Auto-assign teachers when they join
			};
			this.storage.set(TeamsService.TEACHERS_TEAM_ID, team);
		}
		return team;
	}

	/**
	 * Generates the Students team on demand.
	 * @returns The Students team
	 */
	private generateStudentsTeam(): Team {
		const onlinePlayers = world.getAllPlayers();
		const teachers =
			this.getTeam(TeamsService.TEACHERS_TEAM_ID)?.memberIds || [];
		const studentIds = onlinePlayers
			.map((player) => player.id)
			.filter((id) => !teachers.includes(id));
		return {
			id: TeamsService.STUDENTS_TEAM_ID,
			name: "Students",
			description: "All online players not in Teachers team",
			memberIds: studentIds,
			isSystem: true,
			editable: false,
			icon: "student_icon",
		};
	}

	/**
	 * Gets the "All Players" team.
	 * @returns The team containing all online players
	 */
	public getAllPlayersTeam(): Team {
		return this.generateAllPlayersTeam();
	}

	/**
	 * Gets the individual team for a specific player.
	 * @param playerId - ID of the player
	 * @returns The player's individual team or null if not found
	 */
	public getPlayerIndividualTeam(playerId: string): Team | undefined {
		return this.generatePlayerTeam(playerId);
	}

	/**
	 * Updates team properties.
	 * @param teamId - ID of the team
	 * @param properties - Object with properties to update
	 * @returns The updated team
	 * @throws Error if team doesn't exist or is not editable
	 */
	updateTeam(teamId: string, properties: TeamsData): Team {
		const team = this.getTeam(teamId);
		if (!team) {
			throw new Error(`Team with ID '${teamId}' doesn't exist`);
		}
		if (team.editable === false) {
			throw new Error(`Team '${teamId}' is not editable`);
		}
		if (properties.name !== undefined) {
			team.name = properties.name;
		}
		if (properties.color !== undefined) {
			team.color = properties.color;
		}
		if (properties.description !== undefined) {
			team.description = properties.description;
		}
		this.storage.set(teamId, team);
		return team;
	}

	/**
	 * Checks if a team is a system-generated team.
	 * @param teamId - ID of the team
	 * @returns True if the team is a system team, false otherwise
	 */
	public isSystemTeam(teamId: string): boolean {
		return (
			teamId === TeamsService.ALL_PLAYERS_TEAM_ID ||
			teamId === TeamsService.TEACHERS_TEAM_ID ||
			teamId === TeamsService.STUDENTS_TEAM_ID ||
			teamId.startsWith(TeamsService.PLAYER_TEAM_PREFIX)
		);
	}

	public isPlayerTeam(teamId: string): boolean {
		return teamId.startsWith(TeamsService.PLAYER_TEAM_PREFIX);
	}

	/**
	 * Checks if a player is in a specific team.
	 * @param teamId - ID of the team
	 * @param playerId - ID of the player
	 * @returns True if player is in the team, false otherwise
	 */
	isPlayerInTeam(teamId: string, playerId: string): boolean {
		const team = this.getTeam(teamId);
		return team ? team.memberIds.includes(playerId) : false;
	}

	/**
	 * Gets all teams a player belongs to.
	 * @param playerId - ID of the player
	 * @returns Array of teams the player belongs to
	 */
	getPlayerTeams(playerId: string): Team[] {
		return this.getAllTeams().filter((team) =>
			team.memberIds.includes(playerId),
		);
	}

	/**
	 * Gets all team names.
	 * @returns Array of team names
	 */
	getAllTeamNames(): string[] {
		return this.getAllTeams().map((team) => team.name);
	}

	/**
	 * Gets all team IDs.
	 * @returns Array of team IDs
	 */
	getAllTeamIds(): string[] {
		return this.getAllTeamsData().map((team) => team.id);
	}

	/**
	 * Gets all teams data as an object.
	 * @returns Object with team IDs as keys and team objects as values
	 */
	private getAllTeamsData(): Team[] {
		const allKeys: Record<string, any>[] = this.storage.getAll();
		return allKeys
			.map((key) => {
				const team = this.storage.get(key.id) as Team | undefined;
				return team || null;
			})
			.filter((team): team is Team => team !== null);
	}
}
