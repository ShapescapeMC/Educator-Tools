import { Player, world } from "@minecraft/server";
import { Module, ModuleManager } from "../../module-manager.ts";
import { ItemService } from "../item/item.service.ts";
import { TeamsService } from "../teams/teams.service.ts";
import { PropertyStorage } from "@shapescape/storage";
import { FeedbackPromptMechanic } from "./feedback-prompt.mechanic.ts";

export type PromptCandidate = {
	scheduledAt: Date;
	lastActiveAt: Date;
};

/**
 * FeedbackPromptService
 * Manages the feedback prompt system for teachers, tracking when and who should be prompted.
 *
 * Responsibilities:
 * - Maintains candidate registry for players eligible for feedback prompts.
 * - Persists feedback completion state in world storage.
 * - Provides business logic for determining prompt eligibility windows.
 * - Integrates with ItemService to hook tool usage as trigger points.
 * - Coordinates with FeedbackPromptMechanic for runtime enforcement.
 *
 * Storage layout (subStorage `feedback_prompt`):
 *  - feedback_provided_players: string[] (list of player IDs who already provided feedback)
 */
export class FeedbackPromptService implements Module {
	readonly id = "feedback_prompt";
	static readonly id = "feedback_prompt";
	private itemService: ItemService | undefined;
	private teamsService: TeamsService | undefined;
	private storage: PropertyStorage;
	private mechanic?: FeedbackPromptMechanic;

	// Debug logging control
	private static readonly DEBUG_ENABLED = false;

	private playersToPrompt: Map<string, PromptCandidate> = new Map();
	private readonly worldInitDate: Date = new Date();

	private static readonly MIN_PROMPT_DELAY_MINUTES = 5;
	private static readonly SESSION_WARMUP_MINUTES = 10;
	private static readonly IDLE_WINDOW_SECONDS = 15;
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
		this.mechanic = new FeedbackPromptMechanic(this);
		this.mechanic.start();
	}

	/**
	 * Marks a player as having provided feedback and persists the state.
	 * @param player Player who completed the feedback.
	 */
	public markFeedbackProvided(player: Player): void {
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

	/**
	 * Handles tool usage to register teachers as prompt candidates.
	 * @param player Player using an EDU tool.
	 * @returns Whether to open a scene (always false; managed manually).
	 */
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

	/**
	 * Ensures a prompt candidate entry exists for a player.
	 * @param playerId Player identifier.
	 * @returns The existing or newly created candidate.
	 */
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

	public refreshActivityForPlayer(player: Player): void {
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

	public isPromptWindowOpen(candidate: PromptCandidate): boolean {
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

	public wasFeedbackAlreadyAsked(playerId: string): boolean {
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

	/**
	 * Logs the remaining time until a candidate can be prompted, gated by current blockers.
	 * @param player Player being evaluated.
	 * @param candidate Associated prompt candidate state.
	 */
	public logRemainingTime(player: Player, candidate: PromptCandidate): void {
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

	/**
	 * Records that the prompt dialogue was shown for a player.
	 * @param player Player object or identifier.
	 */
	public markPromptShown(player: Player | string): void {
		const playerId = typeof player === "string" ? player : player.id;
		const playerName = typeof player === "string" ? playerId : player.name;
		const candidate = this.playersToPrompt.get(playerId);
		if (!candidate) return;
		this.playersToPrompt.set(playerId, candidate);
		this.debugLog(
			`[FeedbackPrompt] ${playerName}: markPromptShown called at ${new Date().toISOString()}`,
		);
	}

	/**
	 * Determines whether a player should be prompted now based on gating logic.
	 * @param playerOrId Player instance or player identifier.
	 * @returns True if the prompt can be shown immediately.
	 */
	checkIfPlayerShouldBePrompted(playerOrId: Player | string): boolean {
		const player =
			typeof playerOrId === "string"
				? world.getAllPlayers().find((p) => p.id === playerOrId)
				: playerOrId;
		if (!player || !this.isTeacher(player.id)) return false;

		const candidate = this.ensureCandidate(player.id);
		return this.isPromptWindowOpen(candidate);
	}

	/**
	 * Exposes current prompt candidates map.
	 * @returns Map keyed by player ID containing prompt candidates.
	 */
	getPlayersToPrompt(): Map<string, PromptCandidate> {
		return this.playersToPrompt;
	}

	/**
	 * Removes a player from the candidate registry.
	 * @param playerId Player identifier to remove.
	 */
	public removeCandidate(playerId: string): void {
		this.playersToPrompt.delete(playerId);
	}

	/**
	 * Clears all stored feedback state.
	 */
	public clearStorage(): void {
		this.storage.clear();
	}

	// Debug logging helper
	public debugLog(message: string): void {
		if (FeedbackPromptService.DEBUG_ENABLED) {
			console.warn(message);
		}
	}
}
