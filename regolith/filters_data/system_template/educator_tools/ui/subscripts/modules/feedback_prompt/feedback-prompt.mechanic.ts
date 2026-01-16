import { world, system, Player, DimensionTypes } from "@minecraft/server";
import { Vec3 } from "@bedrock-oss/bedrock-boost";
import { FeedbackPromptService } from "./feedback_prompt.service";

/**
 * Runtime enforcement and interaction layer for feedback prompt mechanics.
 *
 * Responsibilities:
 * - Monitors player activity (movement) to track idle states.
 * - Manages NPC entity spawning/despawning for feedback prompts.
 * - Handles script events for feedback interactions (provided, refused, manual prompt).
 * - Maintains bi-directional player-entity linking for active prompt NPCs.
 * - Periodically scans for and removes inactive prompt entities.
 * - Orchestrates the retry loop for opening prompts when conditions are met.
 *
 * Design notes:
 * - Activity monitoring runs with jitter to desynchronize multiplayer workload.
 * - Entity cleanup ensures orphaned NPCs don't persist indefinitely.
 * - NPC spawning is delayed slightly to ensure proper initialization.
 */
export class FeedbackPromptMechanic {
	/** Interval jitter for activity monitoring (in ticks). */
	private static readonly ACTIVITY_MONITOR_JITTER = 20;
	/** Base interval for activity monitoring (in ticks). */
	private static readonly ACTIVITY_MONITOR_BASE = 40;
	/** Interval jitter for retry loop (in ticks). */
	private static readonly RETRY_LOOP_JITTER = 20;
	/** Base interval for retry loop (in ticks). */
	private static readonly RETRY_LOOP_BASE = 20;
	/** Delay before opening dialogue after NPC spawn (in ticks). */
	private static readonly DIALOGUE_OPEN_DELAY = 5;
	/** Timeout before removing stale NPC entities (in ticks). */
	private static readonly NPC_REMOVAL_TIMEOUT = 120 * 20;
	/** NPC spawn height offset above player. */
	private static readonly NPC_SPAWN_HEIGHT = 90;

	/** Players pending prompt attempt in retry loop. */
	private pendingPromptPlayers: Set<string> = new Set();
	/** Players for whom the prompt was already opened this session. */
	private promptOpenedPlayers: Set<string> = new Set();
	/** Bi-directional indexing: playerId -> entityId. */
	private activeEntitiesKeyToValue: Map<string, string> = new Map();
	/** Bi-directional indexing: entityId -> playerId. */
	private activeEntitiesValueToKey: Map<string, string> = new Map();

	constructor(private readonly service: FeedbackPromptService) {}

	/**
	 * Initializes all runtime listeners & periodic tasks.
	 * Call once after world load.
	 */
	public start(): void {
		let edu = true;
		try {
			world
				.getDimension("overworld")
				.runCommand("give @p[tag=edu_tools_non_existent] minecraft:camera");
		} catch (e) {
			edu = false;
		}

		if (!edu) {
			return;
		}
		this.registerScriptEventHandlers();
		this.startActivityMonitor();
		this.startRetryLoop();
	}

	/**
	 * Registers script event handlers for prompt lifecycle events.
	 */
	private registerScriptEventHandlers(): void {
		system.afterEvents.scriptEventReceive.subscribe((event) => {
			if (event.id === "edu_tools:feedback_provided") {
				this.handleFeedbackProvided(event.initiator as Player);
			} else if (event.id === "edu_tools:feedback_refused") {
				this.handleFeedbackRefused(event.initiator as Player);
			} else if (event.id === "edu_tools:feedback_manual_prompt") {
				this.handleManualPrompt(event.sourceEntity as Player);
			} else if (event.id === "edu_tools:feedback_prompt_opened") {
				this.handlePromptOpened(event.initiator as Player);
			} else if (event.id === "edu_tools:feedback_clear_storage") {
				this.service.clearStorage();
			}
		});
	}

	private handleFeedbackProvided(player: Player): void {
		if (!player) return;
		this.service.markFeedbackProvided(player);
		this.service.debugLog(
			`[FeedbackPrompt] ${player.name}: FEEDBACK PROVIDED via script event`,
		);
	}

	/**
	 * Removes a player from prompting after refusal and clears tracking state.
	 * @param player Player who refused.
	 */
	private handleFeedbackRefused(player: Player): void {
		if (!player) return;
		this.pendingPromptPlayers.delete(player.id);
		this.service.removeCandidate(player.id);
		this.service.debugLog(
			`[FeedbackPrompt] ${player.name}: REFUSED feedback - removed from candidates`,
		);
	}

	/**
	 * Manually triggers a prompt for a player via script event.
	 * @param player Player to prompt immediately.
	 */
	private handleManualPrompt(player: Player): void {
		if (!player) return;
		this.promptPlayer(player);
		this.service.debugLog(
			`[FeedbackPrompt] ${player.name}: MANUAL PROMPT triggered`,
		);
	}

	/**
	 * Tracks when a prompt dialogue successfully opened.
	 * @param player Player who saw the prompt.
	 */
	private handlePromptOpened(player: Player): void {
		const playerId = player.id?.trim();
		if (!playerId) return;

		this.pendingPromptPlayers.delete(playerId);
		this.promptOpenedPlayers.add(playerId);
		this.service.markPromptShown(playerId);
		this.service.debugLog(
			`[FeedbackPrompt] ${playerId}: prompt opened - removed from pending, added to opened set`,
		);
	}

	/**
	 * Starts monitoring player activity to track idle status for prompt eligibility.
	 */
	private startActivityMonitor(): void {
		system.runInterval(() => {
			const playersToPrompt = this.service.getPlayersToPrompt();
			if (playersToPrompt.size === 0) return;

			const onlinePlayers = new Map(
				world.getAllPlayers().map((player) => [player.id, player]),
			);

			this.service.debugLog(
				`[FeedbackPrompt] Activity Monitor: checking ${playersToPrompt.size} candidates, ${onlinePlayers.size} online players`,
			);

			for (const playerId of Array.from(playersToPrompt.keys())) {
				const player = onlinePlayers.get(playerId);
				if (!player || !player.isValid) {
					this.service.debugLog(
						`[FeedbackPrompt] ${playerId}: player offline/invalid, skipping activity check`,
					);
					continue;
				}

				this.service.refreshActivityForPlayer(player);
				const candidate = playersToPrompt.get(playerId);
				if (!candidate) continue;

				if (this.promptOpenedPlayers.has(playerId)) {
					this.service.debugLog(
						`[FeedbackPrompt] ${player.name}: prompt already opened, skipping re-prompt`,
					);
					continue;
				}

				if (this.service.wasFeedbackAlreadyAsked(playerId)) {
					this.service.debugLog(
						`[FeedbackPrompt] ${player.name}: feedback already asked (persistent), removing candidate`,
					);
					this.service.removeCandidate(playerId);
					continue;
				}

				if (this.service.isPromptWindowOpen(candidate)) {
					this.service.debugLog(
						`[FeedbackPrompt] ${player.name}: PROMPT WINDOW OPEN - queuing for prompt`,
					);
					this.pendingPromptPlayers.add(playerId);
				} else {
					this.service.logRemainingTime(player, candidate);
				}
			}
		}, FeedbackPromptMechanic.ACTIVITY_MONITOR_BASE + Math.floor(Math.random() * FeedbackPromptMechanic.ACTIVITY_MONITOR_JITTER));
	}

	/**
	 * Retries prompting pending players and cleans up NPC entities.
	 */
	private startRetryLoop(): void {
		system.runInterval(() => {
			this.checkAndRemoveInactiveEntities();
			if (this.pendingPromptPlayers.size === 0) return;

			this.service.debugLog(
				`[FeedbackPrompt] Retry loop: attempting to open dialogue for ${this.pendingPromptPlayers.size} players`,
			);

			for (const playerId of Array.from(this.pendingPromptPlayers.values())) {
				this.tryPromptPlayer(playerId);
			}
		}, FeedbackPromptMechanic.RETRY_LOOP_BASE + Math.floor(Math.random() * FeedbackPromptMechanic.RETRY_LOOP_JITTER));
	}

	/**
	 * Attempts to prompt a player if online, spawning an NPC when needed.
	 * @param playerId Player identifier to prompt.
	 */
	private tryPromptPlayer(playerId: string): void {
		const player = world.getAllPlayers().find((p) => p.id === playerId);
		if (!player) {
			this.pendingPromptPlayers.delete(playerId);
			this.service.debugLog(
				`[FeedbackPrompt] ${playerId}: player no longer online, removing from pending`,
			);
			return;
		}

		let entityId = this.getEntityIdForPlayer(playerId);
		let entity = entityId ? world.getEntity(entityId) : undefined;

		// Spawn entity if it doesn't exist
		if (!entity) {
			const location = Vec3.from(player.location).add(
				new Vec3(0, FeedbackPromptMechanic.NPC_SPAWN_HEIGHT, 0),
			);
			entity = player.dimension.spawnEntity("edu_tools:prompt_npc", location);
			this.linkPlayerEntity(player.id, entity.id);
			entityId = entity.id;
			this.service.debugLog(
				`[FeedbackPrompt] ${player.name}: spawned new NPC at height ${FeedbackPromptMechanic.NPC_SPAWN_HEIGHT}`,
			);
		}

		entity.addTag("edu_tools_self");
		const entityType = entity.getProperty("edu_tools:skin") as
			| number
			| undefined;

		system.runTimeout(() => {
			if (!entity || !entity.isValid) {
				this.service.debugLog(
					`[FeedbackPrompt] ${player.name}: entity became invalid, aborting prompt attempt`,
				);
				if (entityId) this.unlinkByEntityId(entityId);
				return;
			}

			try {
				if (entityType === 0) {
					player.runCommand(
						"dialogue open @e[type=edu_tools:prompt_npc,tag=edu_tools_self, c=1] @s edu_tools_dialogue_prompt_npc_ask_feedback_sam",
					);
					this.service.debugLog(
						`[FeedbackPrompt] ${player.name}: opening dialogue with Sam`,
					);
				} else if (entityType === 1) {
					player.runCommand(
						"dialogue open @e[type=edu_tools:prompt_npc,tag=edu_tools_self, c=1] @s edu_tools_dialogue_prompt_npc_ask_feedback_sarah",
					);
					this.service.debugLog(
						`[FeedbackPrompt] ${player.name}: opening dialogue with Sarah`,
					);
				} else {
					this.service.debugLog(
						`[FeedbackPrompt] ${player.name}: unknown NPC skin type ${entityType}`,
					);
				}
			} catch (error) {
				this.service.debugLog(
					`[FeedbackPrompt] ${player.name}: failed to open dialogue - ${error}`,
				);
			}
			entity.removeTag("edu_tools_self");
		}, FeedbackPromptMechanic.DIALOGUE_OPEN_DELAY);

		system.runTimeout(() => {
			if (entity && entity.isValid) {
				entity.remove();
				if (entityId) this.unlinkByEntityId(entityId);
			}
		}, FeedbackPromptMechanic.NPC_REMOVAL_TIMEOUT);
	}

	public promptPlayer(player: Player): void {
		const location = Vec3.from(player.location).add(
			new Vec3(0, FeedbackPromptMechanic.NPC_SPAWN_HEIGHT, 0),
		);
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
				"dialogue open @e[type=edu_tools:prompt_npc,tag=edu_tools_self, c=1] @s edu_tools_dialogue_prompt_npc_ask_feedback_sam",
			);
		} else if (entityType === 1) {
			player.runCommand(
				"dialogue open @e[type=edu_tools:prompt_npc,tag=edu_tools_self, c=1] @s edu_tools_dialogue_prompt_npc_ask_feedback_sarah",
			);
		}

		entity.removeTag("edu_tools_self");
	}

	/**
	 * Scans all dimensions to remove orphaned prompt NPCs that lost their player link.
	 */
	public checkAndRemoveInactiveEntities(): void {
		const dimensionTypeIds = DimensionTypes.getAll().map((d) => d.typeId);
		let totalRemoved = 0;

		for (const dimTypeId of dimensionTypeIds) {
			const dim = world.getDimension(dimTypeId);
			const entities = dim.getEntities({ type: "edu_tools:prompt_npc" });

			for (const entity of entities) {
				const playerId = this.getPlayerIdForEntity(entity.id);
				if (!playerId) {
					entity.remove();
					totalRemoved++;
					this.service.debugLog(
						`[FeedbackPrompt] Removed orphaned NPC entity ${entity.id} (no linked player)`,
					);
				}
			}
		}

		if (totalRemoved > 0) {
			this.service.debugLog(
				`[FeedbackPrompt] Entity cleanup: removed ${totalRemoved} orphaned NPCs`,
			);
		}
	}

	// Bi-directional player-entity linking
	private setActiveEntity(key: string, value: string): void {
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
			this.activeEntitiesKeyToValue.delete(key);
			this.activeEntitiesValueToKey.delete(value);
		}
	}

	private linkPlayerEntity(playerId: string, entityId: string): void {
		this.service.debugLog(
			`[FeedbackPrompt] LINK: player ${playerId} <-> entity ${entityId}`,
		);
		this.setActiveEntity(playerId, entityId);
	}

	private getEntityIdForPlayer(playerId: string): string | undefined {
		const entityId = this.getActiveEntityByKey(playerId);
		if (entityId) {
			this.service.debugLog(
				`[FeedbackPrompt] GET ENTITY for player ${playerId}: found ${entityId}`,
			);
		}
		return entityId;
	}

	private getPlayerIdForEntity(entityId: string): string | undefined {
		const playerId = this.getActiveEntityByValue(entityId);
		if (playerId) {
			this.service.debugLog(
				`[FeedbackPrompt] GET PLAYER for entity ${entityId}: found ${playerId}`,
			);
		}
		return playerId;
	}

	private unlinkByPlayerId(playerId: string): void {
		this.service.debugLog(`[FeedbackPrompt] UNLINK: player ${playerId}`);
		this.deleteActiveEntityByKey(playerId);
	}

	private unlinkByEntityId(entityId: string): void {
		this.service.debugLog(`[FeedbackPrompt] UNLINK: entity ${entityId}`);
		this.deleteActiveEntityByValue(entityId);
	}
}
