import { DimensionTypes, Player, system, world } from "@minecraft/server";
import { Module, ModuleManager } from "../../module-manager";
import { ItemService } from "../item/item.service";
import { TeamsService } from "../teams/teams.service";
import { PropertyStorage } from "@shapescape/storage";
import { Vec3 } from "@bedrock-oss/bedrock-boost";

type PromptCandidate = {
	scheduledAt: Date;
	lastActiveAt: Date;
	lastPromptedAt?: Date;
};

export class FeedbackPromptService implements Module {
	readonly id = "feedback_prompt";
	static readonly id = "feedback_prompt";
	private itemService: ItemService | undefined;
	private teamsService: TeamsService | undefined;
	private storage: PropertyStorage;

	private playersToPrompt: Map<string, PromptCandidate> = new Map();
	// Bi-directional indexing: key -> value and value -> key
	private activeEntitiesKeyToValue: Map<string, string> = new Map();
	private activeEntitiesValueToKey: Map<string, string> = new Map();
	private pendingPromptPlayers: Set<string> = new Set();
	private readonly worldInitDate: Date = new Date();

	private static readonly MIN_PROMPT_DELAY_MINUTES = 5;
	private static readonly SESSION_WARMUP_MINUTES = 10;
	private static readonly IDLE_WINDOW_SECONDS = 45;
	private static readonly MOVEMENT_SPEED_THRESHOLD = 0.01;

	constructor(private readonly moduleManager: ModuleManager) {
		this.storage = moduleManager
			.getStorage()
			.getSubStorage(FeedbackPromptService.id);
	}

	initialize?(): void {
		this.teamsService = this.moduleManager.getModule(
			TeamsService.id,
		) as TeamsService;
		this.itemService = this.moduleManager.getModule(
			ItemService.id,
		) as ItemService;

		this.registerPromptHook();
		this.startActivityMonitor();

		system.afterEvents.scriptEventReceive.subscribe((event) => {
			if (event.id === "edu_tools:feedback_provided") {
				const player = event.initiator as Player | undefined;
				if (player) {
					this.feedbackProvided(player);
				}
			} else if (event.id === "edu_tools:feedback_refused") {
				// "Maybe Later" selected: do not persist, allow next session to ask again
			} else if (event.id === "edu_tools:feedback_ask") {
				const player = event.sourceEntity as Player | undefined;
				if (player) {
					this.ensureCandidate(player.id);
				}
			} else if (event.id === "edu_tools:feedback_prompt_opened") {
				const player =
					(event.initiator as Player | undefined) ||
					(event.sourceEntity as Player | undefined);
				if (player) {
					this.pendingPromptPlayers.delete(player.id);
				}
			}
		});
	}

	private feedbackProvided(player: Player): void {
		const providedPlayers = this.storage.get(
			"feedback_provided_players",
			true,
			[] as string[],
		);
		if (!providedPlayers.includes(player.id)) {
			providedPlayers.push(player.id);
			this.storage.set("feedback_provided_players", providedPlayers);
		}
	}

	private registerPromptHook(): void {
		this.itemService?.registerScene(FeedbackPromptService.id, {
			priority: 10000,
			condition_callback: (player) => this.handleToolUse(player),
		});
	}

	private startActivityMonitor(): void {
		system.runInterval(() => {
			if (this.playersToPrompt.size === 0) return;

			const onlinePlayers = new Map(
				world.getAllPlayers().map((player) => [player.id, player]),
			);

			for (const playerId of Array.from(this.playersToPrompt.keys())) {
				const player = onlinePlayers.get(playerId);
				if (!player) {
					this.playersToPrompt.delete(playerId);
					continue;
				}

				// Update recent activity based on movement
				this.refreshActivityForPlayer(player);

				// Evaluate whether it's a good time to prompt now
				const candidate = this.playersToPrompt.get(playerId);
				if (
					candidate &&
					this.isPromptWindowOpen(candidate) &&
					!this.wasFeedbackAlreadyAsked(playerId)
				) {
					this.markPromptShown(playerId);
					this.pendingPromptPlayers.add(playerId);
				}
			}
		}, 40);

		system.runInterval(() => {
			if (this.pendingPromptPlayers.size === 0) return;
			for (const playerId of Array.from(this.pendingPromptPlayers.values())) {
				this.tryPromptPlayer(playerId);
			}
			this.checkAndRemoveInactiveEntities();
		}, 60);
	}
	private handleToolUse(player: Player): boolean {
		if (!this.isTeacher(player.id)) {
			return false;
		}

		// Register player as a candidate for feedback prompt
		this.ensureCandidate(player.id);

		// We manage the prompt ourselves and avoid opening a scene directly.
		return false;
	}

	private isTeacher(playerId: string): boolean {
		const teacherTeam = this.teamsService?.getTeam(
			TeamsService.TEACHERS_TEAM_ID,
		);
		return teacherTeam?.memberIds.includes(playerId) ?? false;
	}

	private ensureCandidate(playerId: string): PromptCandidate {
		const existing = this.playersToPrompt.get(playerId);
		if (existing) return existing;

		const now = new Date();
		const candidate: PromptCandidate = {
			scheduledAt: now,
			lastActiveAt: now,
		};
		this.playersToPrompt.set(playerId, candidate);
		return candidate;
	}

	private refreshActivityForPlayer(player: Player): void {
		const candidate = this.playersToPrompt.get(player.id);
		if (!candidate) return;

		const velocity = player.getVelocity();
		const speedSquared =
			velocity.x * velocity.x +
			velocity.y * velocity.y +
			velocity.z * velocity.z;

		if (speedSquared > FeedbackPromptService.MOVEMENT_SPEED_THRESHOLD) {
			candidate.lastActiveAt = new Date();
			this.playersToPrompt.set(player.id, candidate);
		}
	}

	private isPromptWindowOpen(candidate: PromptCandidate): boolean {
		const now = new Date();
		if (!this.hasWorldWarmupElapsed(now)) return false;
		if (!this.hasMinimumDelayElapsed(candidate, now)) return false;
		return this.isIdleEnough(candidate, now);
	}

	private hasWorldWarmupElapsed(now: Date): boolean {
		const minutesSinceWorldInit =
			(now.getTime() - this.worldInitDate.getTime()) / 1000 / 60;
		return (
			minutesSinceWorldInit >= FeedbackPromptService.SESSION_WARMUP_MINUTES
		);
	}

	private hasMinimumDelayElapsed(
		candidate: PromptCandidate,
		now: Date,
	): boolean {
		const minutesSinceSchedule =
			(now.getTime() - candidate.scheduledAt.getTime()) / 1000 / 60;
		return (
			minutesSinceSchedule >= FeedbackPromptService.MIN_PROMPT_DELAY_MINUTES
		);
	}

	private wasFeedbackAlreadyAsked(playerId: string): boolean {
		const providedPlayers = this.storage.get(
			"feedback_provided_players",
			true,
			[] as string[],
		);
		return providedPlayers.includes(playerId);
	}

	private isIdleEnough(candidate: PromptCandidate, now: Date): boolean {
		const idleSeconds =
			(now.getTime() - candidate.lastActiveAt.getTime()) / 1000;
		return idleSeconds >= FeedbackPromptService.IDLE_WINDOW_SECONDS;
	}

	private markPromptShown(playerId: string): void {
		const candidate = this.playersToPrompt.get(playerId);
		if (!candidate) return;
		candidate.lastPromptedAt = new Date();
		this.playersToPrompt.set(playerId, candidate);
	}

	private tryPromptPlayer(playerId: string): void {
		const player = world.getAllPlayers().find((p) => p.id === playerId);
		if (!player) {
			this.pendingPromptPlayers.delete(playerId);
			return;
		}

		let entityId = this.getEntityIdForPlayer(playerId);
		let entity = entityId ? world.getEntity(entityId) : undefined;
		if (!entity) {
			const location = Vec3.from(player.location).add(new Vec3(0, 90, 0));
			entity = player.dimension.spawnEntity("edu_tools:prompt_npc", location);
			this.linkPlayerEntity(player.id, entity.id);
		}

		entity.addTag("edu_tools_self");
		const entityType = entity.getProperty("edu_tools:skin") as
			| number
			| undefined;
		if (entityType === 0) {
			player.runCommand(
				"dialogue open @s @e[type=edu_tools:prompt_npc,c=1] edu_tools_dialogue_prompt_npc_ask_feedback_sam",
			);
		} else if (entityType === 1) {
			player.runCommand(
				"dialogue open @s @e[type=edu_tools:prompt_npc,c=1] edu_tools_dialogue_prompt_npc_ask_feedback_sarah",
			);
		}
		entity.removeTag("edu_tools_self");
	}

	checkIfPlayerShouldBePrompted(playerOrId: Player | string): boolean {
		const player =
			typeof playerOrId === "string"
				? world.getAllPlayers().find((p) => p.id === playerOrId)
				: playerOrId;
		if (!player || !this.isTeacher(player.id)) return false;

		const candidate = this.ensureCandidate(player.id);
		return this.isPromptWindowOpen(candidate);
	}

	getPlayersToPrompt(): Map<string, PromptCandidate> {
		return this.playersToPrompt;
	}

	promptPlayer(player: Player): void {
		const location = Vec3.from(player.location).add(new Vec3(0, 10, 0));
		const entity = player.dimension.spawnEntity(
			"edu_tools:prompt_npc",
			location,
		);
		this.linkPlayerEntity(player.id, entity.id);
		entity.addTag("edu_tools_self");
		const entityType = entity.getProperty("edu_tools:skin") as
			| number
			| undefined;
		if (entityType === 0) {
			player.runCommand(
				"dialogue open @s @e[type=edu_tools:prompt_npc,c=1] edu_tools_dialogue_prompt_npc_ask_feedback_sam",
			);
		} else if (entityType === 1) {
			player.runCommand(
				"dialogue open @s @e[type=edu_tools:prompt_npc,c=1] edu_tools_dialogue_prompt_npc_ask_feedback_sarah",
			);
		}
		entity.removeTag("edu_tools_self");
	}

	// Active Entities bi-index helpers
	private setActiveEntity(key: string, value: string): void {
		// Remove old associations if overwriting
		const existingValue = this.activeEntitiesKeyToValue.get(key);
		if (existingValue && existingValue !== value) {
			this.activeEntitiesValueToKey.delete(existingValue);
		}
		const existingKey = this.activeEntitiesValueToKey.get(value);
		if (existingKey && existingKey !== key) {
			this.activeEntitiesKeyToValue.delete(existingKey);
		}
		this.activeEntitiesKeyToValue.set(key, value);
		this.activeEntitiesValueToKey.set(value, key);
	}

	private getActiveEntityByKey(key: string): string | undefined {
		return this.activeEntitiesKeyToValue.get(key);
	}

	private getActiveEntityByValue(value: string): string | undefined {
		return this.activeEntitiesValueToKey.get(value);
	}

	private deleteActiveEntityByKey(key: string): void {
		const value = this.activeEntitiesKeyToValue.get(key);
		if (value) {
			this.activeEntitiesKeyToValue.delete(key);
			this.activeEntitiesValueToKey.delete(value);
		}
	}

	private deleteActiveEntityByValue(value: string): void {
		const key = this.activeEntitiesValueToKey.get(value);
		if (key) {
			this.activeEntitiesValueToKey.delete(value);
			this.activeEntitiesKeyToValue.delete(key);
		}
	}

	checkAndRemoveInactiveEntities(): void {
		const dimensionTypeIds = DimensionTypes.getAll().map((d) => d.typeId);

		for (const dimTypeId of dimensionTypeIds) {
			const dim = world.getDimension(dimTypeId);
			const entities = dim.getEntities({ type: "edu_tools:prompt_npc" });
			for (const entity of entities) {
				if (this.getPlayerIdForEntity(entity.id)) continue; // Still linked to a player
				entity.remove();
			}
		}
	}

	// Typed helpers for player/entity links
	private linkPlayerEntity(playerId: string, entityId: string): void {
		this.setActiveEntity(playerId, entityId);
	}

	private getEntityIdForPlayer(playerId: string): string | undefined {
		return this.getActiveEntityByKey(playerId);
	}

	private getPlayerIdForEntity(entityId: string): string | undefined {
		return this.getActiveEntityByValue(entityId);
	}

	private unlinkByPlayerId(playerId: string): void {
		this.deleteActiveEntityByKey(playerId);
	}

	private unlinkByEntityId(entityId: string): void {
		this.deleteActiveEntityByValue(entityId);
	}
}
