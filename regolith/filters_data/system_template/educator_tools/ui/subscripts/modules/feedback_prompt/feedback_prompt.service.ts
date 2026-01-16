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

	// Debug logging control
	private static readonly DEBUG_ENABLED = false;

	private playersToPrompt: Map<string, PromptCandidate> = new Map();
	// Bi-directional indexing: key -> value and value -> key
	private activeEntitiesKeyToValue: Map<string, string> = new Map();
	private activeEntitiesValueToKey: Map<string, string> = new Map();
	private pendingPromptPlayers: Set<string> = new Set();
	// Players for whom the prompt was already opened this session - no more prompts
	private promptOpenedPlayers: Set<string> = new Set();
	private readonly worldInitDate: Date = new Date();

	private static readonly MIN_PROMPT_DELAY_MINUTES = 1;
	private static readonly SESSION_WARMUP_MINUTES = 1;
	private static readonly IDLE_WINDOW_SECONDS = 10;
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
				const player = event.initiator as Player | undefined;
				if (player) {
					this.debugLog(
						`[FeedbackPrompt] ${player.name}: selected "Maybe Later" - will be asked again next session`,
					);
				}
			} else if (event.id === "edu_tools:feedback_manual_prompt") {
				const player = event.sourceEntity as Player | undefined;
				if (player) {
					this.tryPromptPlayer(player.id);
				}
			} else if (event.id === "edu_tools:feedback_prompt_opened") {
				const player = event.initiator as Player | undefined;
				if (player) {
					this.pendingPromptPlayers.delete(player.id);
					this.playersToPrompt.delete(player.id);
					this.promptOpenedPlayers.add(player.id);
					this.markPromptShown(player);
					this.debugLog(
						`[FeedbackPrompt] ${player.name}: dialogue opened successfully, removed from retry queue, added to opened list`,
					);
				}
			} else if (event.id === "edu_tools:feedback_clear_storage") {
				this.storage.set("feedback_provided_players", []);
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
			this.debugLog(
				`[FeedbackPrompt] ${player.name}: FEEDBACK PROVIDED - stored in persistent list`,
			);
		} else {
			this.debugLog(
				`[FeedbackPrompt] ${player.name}: feedback already recorded, skipping duplicate`,
			);
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

			this.debugLog(
				`[FeedbackPrompt] Activity Monitor: checking ${this.playersToPrompt.size} candidates, ${onlinePlayers.size} online players`,
			);

			for (const playerId of Array.from(this.playersToPrompt.keys())) {
				const player = onlinePlayers.get(playerId);
				if (!player) {
					this.playersToPrompt.delete(playerId);
					this.debugLog(
						`[FeedbackPrompt] ${playerId}: removed from candidates (player offline)`,
					);
					continue;
				}

				// Update recent activity based on movement
				this.refreshActivityForPlayer(player);

				// Evaluate whether it's a good time to prompt now
				const candidate = this.playersToPrompt.get(playerId);
				if (
					candidate &&
					this.isPromptWindowOpen(candidate) &&
					!this.wasFeedbackAlreadyAsked(playerId) &&
					!this.promptOpenedPlayers.has(playerId)
				) {
					this.markPromptShown(player);
					this.pendingPromptPlayers.add(playerId);
					this.debugLog(
						`[FeedbackPrompt] ${player.name}: marked for prompt - added to pending queue`,
					);
				} else if (candidate) {
					// Debug: show remaining time
					this.logRemainingTime(player, candidate);
				}
			}
		}, 40 + Math.floor(Math.random() * 20)); // Every 1-2 seconds

		system.runInterval(() => {
			this.checkAndRemoveInactiveEntities();
			if (this.pendingPromptPlayers.size === 0) return;
			this.debugLog(
				`[FeedbackPrompt] Retry loop: attempting to open dialogue for ${this.pendingPromptPlayers.size} players`,
			);
			for (const playerId of Array.from(this.pendingPromptPlayers.values())) {
				this.tryPromptPlayer(playerId);
			}
		}, 20 + Math.floor(Math.random() * 20));
	}
	private handleToolUse(player: Player): boolean {
		if (!this.isTeacher(player.id)) {
			this.debugLog(
				`[FeedbackPrompt] ${player.name}: tool used but NOT a teacher, skipping feedback prompt registration`,
			);
			return false;
		}

		// Register player as a candidate for feedback prompt
		this.ensureCandidate(player.id);
		this.debugLog(
			`[FeedbackPrompt] ${player.name}: tool used - registered as feedback prompt candidate (will prompt in 5+ min if idle)`,
		);

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
		if (existing) {
			this.debugLog(
				`[FeedbackPrompt] ${playerId}: candidate already exists, reusing (scheduled at ${existing.scheduledAt.toISOString()})`,
			);
			return existing;
		}

		const now = new Date();
		const candidate: PromptCandidate = {
			scheduledAt: now,
			lastActiveAt: now,
		};
		this.playersToPrompt.set(playerId, candidate);
		this.debugLog(
			`[FeedbackPrompt] ${playerId}: NEW candidate created at ${now.toISOString()} (will be eligible for prompt in 5+ min)`,
		);
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
			const oldActivityTime = candidate.lastActiveAt.toISOString();
			candidate.lastActiveAt = new Date();
			this.playersToPrompt.set(player.id, candidate);
			this.debugLog(
				`[FeedbackPrompt] ${player.name}: activity detected (speed=${Math.sqrt(
					speedSquared,
				).toFixed(3)}), reset idle timer from ${oldActivityTime}`,
			);
		}
	}

	private isPromptWindowOpen(candidate: PromptCandidate): boolean {
		const now = new Date();
		if (!this.hasWorldWarmupElapsed(now)) {
			this.debugLog(
				`[FeedbackPrompt] isPromptWindowOpen: BLOCKED - world warmup not elapsed`,
			);
			return false;
		}
		if (!this.hasMinimumDelayElapsed(candidate, now)) {
			this.debugLog(
				`[FeedbackPrompt] isPromptWindowOpen: BLOCKED - minimum delay not elapsed since tool use`,
			);
			return false;
		}
		const isIdle = this.isIdleEnough(candidate, now);
		if (!isIdle) {
			this.debugLog(
				`[FeedbackPrompt] isPromptWindowOpen: BLOCKED - player not idle`,
			);
			return false;
		}
		this.debugLog(
			`[FeedbackPrompt] isPromptWindowOpen: ALL GATES PASSED - ready to prompt`,
		);
		return true;
	}

	private hasWorldWarmupElapsed(now: Date): boolean {
		const minutesSinceWorldInit =
			(now.getTime() - this.worldInitDate.getTime()) / 1000 / 60;
		const hasElapsed =
			minutesSinceWorldInit >= FeedbackPromptService.SESSION_WARMUP_MINUTES;
		this.debugLog(
			`[FeedbackPrompt] hasWorldWarmupElapsed: ${minutesSinceWorldInit.toFixed(
				2,
			)}/${FeedbackPromptService.SESSION_WARMUP_MINUTES} min = ${hasElapsed}`,
		);
		return hasElapsed;
	}

	private hasMinimumDelayElapsed(
		candidate: PromptCandidate,
		now: Date,
	): boolean {
		const minutesSinceSchedule =
			(now.getTime() - candidate.scheduledAt.getTime()) / 1000 / 60;
		const hasElapsed =
			minutesSinceSchedule >= FeedbackPromptService.MIN_PROMPT_DELAY_MINUTES;
		this.debugLog(
			`[FeedbackPrompt] hasMinimumDelayElapsed: ${minutesSinceSchedule.toFixed(
				2,
			)}/${FeedbackPromptService.MIN_PROMPT_DELAY_MINUTES} min = ${hasElapsed}`,
		);
		return hasElapsed;
	}

	private wasFeedbackAlreadyAsked(playerId: string): boolean {
		const providedPlayers = this.storage.get(
			"feedback_provided_players",
			true,
			[] as string[],
		);
		const wasAsked = providedPlayers.includes(playerId);
		if (wasAsked) {
			this.debugLog(
				`[FeedbackPrompt] ${playerId}: feedback already asked (found in persistent list of ${providedPlayers.length})`,
			);
		}
		return wasAsked;
	}

	private isIdleEnough(candidate: PromptCandidate, now: Date): boolean {
		const idleSeconds =
			(now.getTime() - candidate.lastActiveAt.getTime()) / 1000;
		const isIdle = idleSeconds >= FeedbackPromptService.IDLE_WINDOW_SECONDS;
		this.debugLog(
			`[FeedbackPrompt] isIdleEnough: idle ${idleSeconds.toFixed(1)}/${
				FeedbackPromptService.IDLE_WINDOW_SECONDS
			} sec = ${isIdle}`,
		);
		return isIdle;
	}

	private logRemainingTime(player: Player, candidate: PromptCandidate): void {
		const now = new Date();
		let reason = "";
		let remaining = 0;

		if (!this.hasWorldWarmupElapsed(now)) {
			const minutesSinceWorldInit =
				(now.getTime() - this.worldInitDate.getTime()) / 1000 / 60;
			remaining =
				FeedbackPromptService.SESSION_WARMUP_MINUTES - minutesSinceWorldInit;
			reason = "waiting for world warmup";
		} else if (!this.hasMinimumDelayElapsed(candidate, now)) {
			const minutesSinceSchedule =
				(now.getTime() - candidate.scheduledAt.getTime()) / 1000 / 60;
			remaining =
				FeedbackPromptService.MIN_PROMPT_DELAY_MINUTES - minutesSinceSchedule;
			reason = "waiting for min delay from tool use";
		} else if (!this.isIdleEnough(candidate, now)) {
			const idleSeconds =
				(now.getTime() - candidate.lastActiveAt.getTime()) / 1000;
			remaining =
				(FeedbackPromptService.IDLE_WINDOW_SECONDS - idleSeconds) / 60;
			reason = "player not idle enough";
		}

		if (reason && remaining > 0) {
			this.debugLog(
				`[FeedbackPrompt] ${player.name}: ${reason}, ~${remaining.toFixed(
					2,
				)} min remaining`,
			);
		}
	}

	private markPromptShown(player: Player | string): void {
		const playerId = typeof player === "string" ? player : player.id;
		const playerName = typeof player === "string" ? playerId : player.name;
		const candidate = this.playersToPrompt.get(playerId);
		if (!candidate) return;
		candidate.lastPromptedAt = new Date();
		this.playersToPrompt.set(playerId, candidate);
		this.debugLog(
			`[FeedbackPrompt] ${playerName}: markPromptShown called at ${new Date().toISOString()}`,
		);
	}

	private tryPromptPlayer(playerId: string): void {
		const player = world.getAllPlayers().find((p) => p.id === playerId);
		if (!player) {
			this.pendingPromptPlayers.delete(playerId);
			this.debugLog(
				`[FeedbackPrompt] ${playerId}: player offline, removed from retry queue`,
			);
			return;
		}

		let entityId = this.getEntityIdForPlayer(playerId);
		let entity = entityId ? world.getEntity(entityId) : undefined;
		if (!entity) {
			const location = Vec3.from(player.location).add(new Vec3(0, 90, 0));
			entity = player.dimension.spawnEntity("edu_tools:prompt_npc", location);
			this.linkPlayerEntity(player.id, entity.id);
			this.debugLog(
				`[FeedbackPrompt] ${
					player.name
				}: spawned prompt NPC at ${location.x.toFixed(0)}, ${location.y.toFixed(
					0,
				)}, ${location.z.toFixed(0)}`,
			);
		}

		entity.addTag("edu_tools_self");
		const entityType = entity.getProperty("edu_tools:skin") as
			| number
			| undefined;
		system.runTimeout(() => {
			if (entityType === 0) {
				player.runCommand(
					"dialogue open @e[type=edu_tools:prompt_npc,tag=edu_tools_self, c=1] @s edu_tools_dialogue_prompt_npc_ask_feedback_sam",
				);
				this.debugLog(
					`[FeedbackPrompt] ${player.name}: opening dialogue with Sam`,
				);
			} else if (entityType === 1) {
				player.runCommand(
					"dialogue open @e[type=edu_tools:prompt_npc,tag=edu_tools_self, c=1] @s edu_tools_dialogue_prompt_npc_ask_feedback_sarah",
				);
				this.debugLog(
					`[FeedbackPrompt] ${player.name}: opening dialogue with Sarah`,
				);
			} else {
				this.debugLog(
					`[FeedbackPrompt] ${player.name}: unknown NPC skin type ${entityType}`,
				);
			}
			entity.removeTag("edu_tools_self");
		}, 5); // Delay to ensure entity is fully initialized

		system.runTimeout(() => {
			this.unlinkByEntityId(entity!.id);
			if (entity && entity.isValid) entity?.remove();
		}, 120 * 20); // Remove after 120 seconds if still present
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
		let totalRemoved = 0;

		for (const dimTypeId of dimensionTypeIds) {
			const dim = world.getDimension(dimTypeId);
			const entities = dim.getEntities({ type: "edu_tools:prompt_npc" });
			for (const entity of entities) {
				if (this.getPlayerIdForEntity(entity.id)) {
					this.debugLog(
						`[FeedbackPrompt] NPC ${entity.id}: still linked to player, keeping alive`,
					);
					continue; // Still linked to a player
				}
				this.debugLog(
					`[FeedbackPrompt] NPC ${entity.id}: orphaned - removing from ${dimTypeId}`,
				);
				entity.remove();
				totalRemoved++;
			}
		}

		if (totalRemoved > 0) {
			this.debugLog(
				`[FeedbackPrompt] Cleanup: removed ${totalRemoved} orphaned NPCs from ${dimensionTypeIds.length} dimensions`,
			);
		}
	}

	// Typed helpers for player/entity links
	private linkPlayerEntity(playerId: string, entityId: string): void {
		this.debugLog(
			`[FeedbackPrompt] LINK: player ${playerId} <-> entity ${entityId}`,
		);
		this.setActiveEntity(playerId, entityId);
	}

	private getEntityIdForPlayer(playerId: string): string | undefined {
		const entityId = this.getActiveEntityByKey(playerId);
		if (entityId) {
			this.debugLog(
				`[FeedbackPrompt] GET: player ${playerId} -> entity ${entityId}`,
			);
		}
		return entityId;
	}

	private getPlayerIdForEntity(entityId: string): string | undefined {
		const playerId = this.getActiveEntityByValue(entityId);
		if (playerId) {
			this.debugLog(
				`[FeedbackPrompt] GET: entity ${entityId} -> player ${playerId}`,
			);
		}
		return playerId;
	}

	private unlinkByPlayerId(playerId: string): void {
		this.debugLog(`[FeedbackPrompt] UNLINK: player ${playerId}`);
		this.deleteActiveEntityByKey(playerId);
	}

	private unlinkByEntityId(entityId: string): void {
		this.debugLog(`[FeedbackPrompt] UNLINK: entity ${entityId}`);
		this.deleteActiveEntityByValue(entityId);
	}

	// Debug logging helper
	private debugLog(message: string): void {
		if (FeedbackPromptService.DEBUG_ENABLED) {
			this.debugLog(message);
		}
	}
}
