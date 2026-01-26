import { CachedStorage, PropertyStorage } from "@shapescape/storage";
import { Module } from "../../module-manager.ts";
import {
	Entity,
	EntityHealthComponent,
	Player,
	system,
	world,
} from "@minecraft/server";
import { TimerMechanic } from "./timer.mechanic.ts";
import { Vec3 } from "@bedrock-oss/bedrock-boost";
import { SceneContext } from "../scene_manager/scene-context.ts";
import { SceneManager } from "../scene_manager/scene-manager.ts";
import { TimerScene } from "./timer.scene.ts";
import { ButtonConfig } from "../main/main.service.ts";
import { TimerEditScene } from "./timer-edit.scene.ts";

/**
 * Represents a timer configuration and state
 */
export interface Timer {
	/** The duration of the timer in seconds */
	duration: TimerDuration;
	/** Whether the timer has been started at least once */
	started: boolean;
	/** Whether the timer is currently paused */
	isPaused: boolean;
	/** Timestamp when the timer was started (Unix timestamp in milliseconds, as from JavaScript Date.now()) */
	startedAt: number;
	/** Timestamp when the timer was paused (0 if not paused) */
	pausedAt: number;
	/** Total duration the timer has been paused (in milliseconds) */
	pauseDuration: number;
	/** Optional entity ID for the visual timer entity */
	entityId?: string;
	/** Whether the timer entity is currently visible */
	entityShown?: boolean;
	/** Last game tick recorded for activity tracking */
	lastTick?: number;
	/** Last real world timestamp recorded (ms) */
	lastRealTime?: number;
	/** If true, offline time counts down (timer continues while game is closed). If false, offline time is paused. */
	countOffline?: boolean;
}

/**
 * Predefined timer duration options in seconds
 */
export enum TimerDuration {
	SEC_30 = 30,
	MIN_1 = 60,
	MIN_2 = 120,
	MIN_3 = 180,
	MIN_5 = 300,
	MIN_10 = 600,
	MIN_15 = 900,
	MIN_30 = 1800,
	MIN_45 = 2700,
	MIN_60 = 3600,
	MIN_90 = 5400,
}

/**
 * Service class for managing timer functionality
 * Handles timer state, persistence, and visual representation
 */
export class TimerService implements Module {
	public static readonly id = "timer";
	public readonly id = TimerService.id;
	private timerMechanic: TimerMechanic | undefined;

	/** Storage instance for persisting timer data */
	private readonly storage: PropertyStorage;

	constructor() {
		this.storage = new CachedStorage(world, "timer");
	}

	initialize(): void {
		// Initialize the timer mechanic to handle periodic updates
		this.timerMechanic = new TimerMechanic(this);
		this.timerMechanic.initialize();
	}

	/**
	 * Registers scenes related to timer management
	 * @param sceneManager Scene manager instance to register scenes with
	 */
	registerScenes(sceneManager: SceneManager): void {
		sceneManager.registerScene(
			"timer",
			(manager: SceneManager, context: SceneContext) => {
				new TimerScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			"edit_timer",
			(manager: SceneManager, context: SceneContext) => {
				new TimerEditScene(manager, context, this);
			},
		);
	}

	/**
	 * Gets the main button configuration for the timer module
	 * @returns Button configuration for the main menu
	 */
	getMainButton(): ButtonConfig {
		return {
			labelKey: "edu_tools.ui.main.buttons.timer",
			iconPath: "textures/edu_tools/ui/icons/main/timer",
			handler: (sceneManager: SceneManager, context: SceneContext) => {
				sceneManager.openSceneWithContext(context, "timer", true);
			},
			weight: 100,
		};
	}

	/**
	 * Updates specific properties of the current timer
	 * @param timer Partial timer object with properties to update
	 */
	updateTimer(timer: Partial<Timer>): void {
		const existingTimer = this.getTimer();
		if (!existingTimer) {
			console.warn("[TimerService] No existing timer found to update.");
			return;
		}

		const updatedTimer: Timer = {
			...existingTimer,
			...timer,
		};

		this.saveTimer(updatedTimer);
	}

	newTimer(timer: Partial<Timer>, player?: Player): Timer {
		const newTimer: Timer = {
			duration: TimerDuration.MIN_1, // Default to 1 minute if not specified
			started: false,
			isPaused: false,
			startedAt: 0,
			pausedAt: 0,
			pauseDuration: 0,
			entityId: undefined,
			entityShown: false,
			lastTick: system.currentTick,
			lastRealTime: Date.now(),
			countOffline: false,
			...timer, // Merge with provided properties
		};
		if (!timer.entityId) {
			const entity = this.summonEntityAtPlayer(
				player || world.getAllPlayers()[0],
			);
			if (entity) {
				newTimer.entityId = entity.id;
			}
		}
		this.saveTimer(newTimer);
		this.updateTimerEntity(); // Ensure the entity is updated with the new timer state
		return newTimer;
	}

	/**
	 * Persists timer data to storage and updates cache
	 * @param timer Timer object to save
	 */
	saveTimer(timer: Timer): void {
		this.storage.set("timer", timer);
	}

	/**
	 * Retrieves the current timer from cache or storage
	 * @returns Current timer or undefined if no timer exists
	 */
	getTimer(): Timer | undefined {
		const t = this.storage.get("timer") as Timer | undefined;
		let mutated = false;
		if (t) {
			// Backward compatibility: if fields missing populate them
			if (t.lastTick === undefined) {
				t.lastTick = system.currentTick;
				mutated = true;
			}
			if (t.lastRealTime === undefined) {
				t.lastRealTime = Date.now();
				mutated = true;
			}
			if (t.countOffline === undefined) {
				// Default old timers to NOT counting offline time (i.e., preserve previous pause-on-offline behavior)
				t.countOffline = false;
				mutated = true;
			}
			if (mutated) {
				this.saveTimer(t);
			}
		}
		return t;
	}

	/**
	 * Removes the timer from storage and clears cache
	 */
	clearTimer(): void {
		this.storage.set("timer", undefined);
		this.removeEntity(); // Remove the visual entity if it exists
	}

	summonEntityAtPlayer(player: Entity): Entity | undefined {
		this.removeEntity(); // Remove any existing entity first
		const entity = player.dimension.spawnEntity(
			"edu_tools:timer",
			player.location,
		);
		if (entity) {
			const timer = this.getTimer();
			if (timer) {
				timer.entityId = entity.id; // Store the entity ID in the timer
				this.saveTimer(timer);
			}

			this.updateTimerEntity(); // Update the entity with current timer state
			return entity;
		}
	}

	removeEntity(): void {
		const entity = this.getEntity();
		if (entity) {
			entity.remove(); // Remove the visual entity if it exists
		}
		const otherEntities = world.getDimension("overworld").getEntities({
			type: "edu_tools:timer",
		});
		otherEntities.forEach((e) => {
			e.remove(); // Remove any other timer entities in the world
		});
	}

	/**
	 * Creates a new timer with the specified duration
	 * @param duration Timer duration in seconds
	 * @returns The newly created timer
	 */
	resetTimer(duration: TimerDuration): Timer {
		const timer: Timer = {
			duration,
			started: false,
			isPaused: false,
			startedAt: 0,
			pausedAt: 0,
			pauseDuration: 0,
			entityId: undefined,
			entityShown: false,
		};

		this.saveTimer(timer);
		return timer;
	}

	/**
	 * Pauses the currently running timer
	 * Only works if timer is running and not already paused
	 */
	pauseTimer(): void {
		const timer = this.getTimer();

		// Validate timer state before pausing
		if (!timer || !this.isTimerRunning()) {
			console.warn("[TimerService] Cannot pause timer - invalid state");
			return;
		}

		this.updateTimer({
			isPaused: true,
			pausedAt: Date.now(),
		});
	}

	/**
	 * Resumes a paused timer
	 * Only works if timer is currently paused
	 */
	resumeTimer(): void {
		const timer = this.getTimer();

		// Validate timer state before resuming
		if (!timer || !timer.isPaused) {
			console.warn("[TimerService] Cannot resume timer - not paused");
			return;
		}

		// Calculate how long the timer was paused (in milliseconds)
		const pauseTime = Date.now() - timer.pausedAt;

		this.updateTimer({
			isPaused: false,
			pausedAt: 0,
			pauseDuration: timer.pauseDuration + pauseTime,
			lastTick: system.currentTick,
			lastRealTime: Date.now(),
		});
	}

	/**
	 * Calculates the remaining time in milliseconds for the current timer
	 * Takes into account pause duration for accurate calculation
	 * @returns Remaining time in milliseconds (0 if timer expired or doesn't exist)
	 */
	getRemainingTime(): number {
		const timer = this.getTimer();
		if (!timer) {
			return 0;
		}
		if (!timer.started) {
			return timer.duration * 1000; // Full duration in milliseconds if not started
		}

		let elapsed: number;

		if (timer.isPaused) {
			// Calculate elapsed time up to when it was paused
			elapsed = timer.pausedAt - timer.startedAt - timer.pauseDuration;
		} else {
			// Calculate current elapsed time (excluding pause duration)
			elapsed = Date.now() - timer.startedAt - timer.pauseDuration;
		}

		const totalDurationMs = timer.duration * 1000; // Convert seconds to milliseconds
		const remaining = totalDurationMs - elapsed;

		return Math.max(0, remaining);
	}

	/**
	 * Gets the timer's visual entity from the world
	 * @returns Entity instance or undefined if not found
	 */
	getEntity(): Entity | undefined {
		const timer = this.getTimer();
		if (!timer?.entityId) {
			return undefined;
		}

		try {
			return world.getEntity(timer.entityId);
		} catch (error) {
			console.warn("[TimerService] Failed to get timer entity:", error);
			return undefined;
		}
	}

	isTimerRunning(): boolean {
		const timer = this.getTimer();
		return !!timer && timer.started && !timer.isPaused;
	}

	startTimer(): void {
		const timer = this.getTimer();
		if (!timer) {
			console.warn("[TimerService] No timer found to start.");
			return;
		}
		if (timer.started) {
			console.warn("[TimerService] Timer is already running.");
			return;
		}
		// Set the started state and current timestamp as the start time
		this.updateTimer({
			started: true,
			startedAt: Date.now(),
			isPaused: false,
			pausedAt: 0,
			pauseDuration: 0,
			lastTick: system.currentTick,
			lastRealTime: Date.now(),
		});
		this.updateTimerEntity(); // Update the entity to reflect the new timer state
	}

	/**
	 * Detects inactivity (time while game not open) and adjusts pauseDuration so timer "waits" during offline time.
	 * Uses difference between system ticks and real time to avoid double-counting lag.
	 * Unlimited offline time supported, with safety heuristics to ignore corrupted or implausible data.
	 */
	handleInactivity(): void {
		const timer = this.getTimer();
		if (!timer || !timer.started) return;
		// If currently paused we still update markers but don't add extra pauseDuration
		const currentTick = system.currentTick;
		const now = Date.now();
		const TICK_MS = 50; // Expected ms per tick
		// Ignore differences under this threshold as they likely represent normal tick timing variance or brief lag spikes
		const MIN_OFFLINE_THRESHOLD_MS = 250;
		if (timer.lastTick === undefined || timer.lastRealTime === undefined) {
			this.updateTimer({ lastTick: currentTick, lastRealTime: now });
			return;
		}
		const tickDelta = currentTick - timer.lastTick;
		const realDelta = now - timer.lastRealTime;
		// Expected real time that should have passed given tickDelta
		const expectedMs = tickDelta * TICK_MS;
		// Offline time = real time passed minus expected time (if positive and reasonable)
		let offlineMs = realDelta - expectedMs;
		// SAFETY HEURISTICS
		// 1. Negative or tiny differences -> treat as jitter, ignore.
		if (offlineMs < MIN_OFFLINE_THRESHOLD_MS) offlineMs = 0;
		// 2. Tick rollback (tickDelta < 0) indicates possible world reload with lost state; ignore offline.
		if (tickDelta < 0) offlineMs = 0;
		// 3. Suspicious ratio: if realDelta is less than expectedMs (lag spike) no offline adjustment.
		if (realDelta < expectedMs) offlineMs = 0;
		// 4. Extremely huge offline vs startedAt (> 365 days) -> likely system clock change; clamp to one year to stay unlimited but sane.
		const ONE_YEAR_MS = 365 * 24 * 3600 * 1000;
		if (offlineMs > ONE_YEAR_MS) {
			console.warn(
				"[TimerService] Detected offline time exceeding one year, clamping to prevent clock skew issues.",
			);
			offlineMs = ONE_YEAR_MS;
		}
		// (No fixed cap like 24h; genuine long breaks are now supported.)
		if (offlineMs > 0 && !timer.isPaused) {
			if (timer.countOffline) {
				// Timer counts down while offline: we do NOT add offlineMs to pauseDuration; just refresh markers.
				this.updateTimer({ lastTick: currentTick, lastRealTime: now });
			} else {
				// Pause while offline: convert offline time into pauseDuration so remaining time is preserved
				this.updateTimer({
					pauseDuration: timer.pauseDuration + offlineMs,
					lastTick: currentTick,
					lastRealTime: now,
				});
			}
		} else {
			// Just refresh markers
			this.updateTimer({ lastTick: currentTick, lastRealTime: now });
		}
	}

	/**
	 * Updates the visual representation of the timer entity
	 * Shows countdown time and updates health bar to represent progress
	 */
	updateTimerEntity(): void {
		const timer = this.getTimer();
		if (!timer) return;

		const entity = this.getEntity();
		if (!entity) return;

		const isRunning = this.isTimerRunning();

		// Show blinking display when timer is not running or is paused
		if (!isRunning) {
			const shouldShow = Math.floor(Date.now() / 1000) % 2 === 0;
			entity.nameTag = shouldShow
				? this.formatTime(this.getRemainingTime())
				: "--:--:--";
			if (shouldShow) {
				entity.triggerEvent("edu_tools:clear_timer");
				entity.triggerEvent(
					"edu_tools:set_timer_" +
						this.formatTime(this.getRemainingTime()).replace(/:/g, "_"),
				);
			} else {
				entity.triggerEvent("edu_tools:pause_timer");
			}
			return;
		}

		const remainingTime = this.getRemainingTime();

		// Timer expired - clear it
		if (remainingTime <= 0) {
			this.clearTimer();
			return;
		}

		const remainingSeconds = remainingTime / 1000;
		// Show countdown warnings and final alert in the last 11 seconds
		if (remainingSeconds < 11) {
			// Show "times up" message only in the final 50ms (exactly 1 tick; 1 tick = 50ms in Minecraft)
			// This prevents premature "times up" messages while still giving a final warning
			if (remainingTime < 50) {
				world.sendMessage([
					{
						translate: "edu_tools.message.timer.times_up",
					},
				]);
				world.getPlayers().forEach((player) => {
					player.playSound("random.anvil_use", { volume: 0.3, pitch: 2 });
				});
			} else {
				// Countdown warnings for 1-10 seconds remaining
				world.sendMessage([
					{
						translate: "edu_tools.message.timer.time_left",
						with: [this.formatTime(remainingTime)],
					},
					// select second or seconds based on remaining time
					remainingSeconds === 1
						? { translate: "edu_tools.ui.timer.time.second" }
						: { translate: "edu_tools.ui.timer.time.seconds" },
				]);
				world.getPlayers().forEach((player) => {
					player.playSound("random.anvil_land", { volume: 0.3, pitch: 2 });
				});
			}
		}

		// Update display with remaining time
		entity.nameTag = this.formatTime(remainingTime);
		entity.triggerEvent("edu_tools:clear_timer");
		entity.triggerEvent(
			"edu_tools:set_timer_" +
				this.formatTime(remainingTime).replace(/:/g, "_"),
		);

		// Update health bar to show progress
		this.updateEntityHealth(entity, remainingTime, timer.duration * 1000);

		if (!timer.entityShown) {
			const player = world.getAllPlayers()[0]; // Get the first player
			if (player) {
				entity.teleport(Vec3.from(player.location).add(0, 1000, 0)); // Position above the player
			}
		}
	}

	/**
	 * Formats time in milliseconds to HH:MM:SS string
	 * @param milliseconds Time in milliseconds
	 * @returns Formatted time string
	 */
	private formatTime(milliseconds: number): string {
		const totalSeconds = Math.floor(milliseconds / 1000);
		const seconds = totalSeconds % 60;
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const hours = Math.floor(totalSeconds / 3600);

		return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
			.toString()
			.padStart(2, "0")}`;
	}

	/**
	 * Updates the entity's health component to represent timer progress
	 * @param entity The timer entity
	 * @param remainingTime Remaining time in milliseconds
	 * @param totalTime Total timer duration in milliseconds
	 */
	private updateEntityHealth(
		entity: Entity,
		remainingTime: number,
		totalTime: number,
	): void {
		try {
			const healthComponent = entity.getComponent(
				EntityHealthComponent.componentId,
			) as EntityHealthComponent;

			if (healthComponent) {
				const maxHealth = healthComponent.effectiveMax;
				const proportionalHealth = (remainingTime / totalTime) * maxHealth;
				healthComponent.setCurrentValue(Math.max(1, proportionalHealth)); // Ensure minimum 1 health
			}
		} catch (error) {
			console.warn("[TimerService] Failed to update entity health:", error);
		}
	}
}
