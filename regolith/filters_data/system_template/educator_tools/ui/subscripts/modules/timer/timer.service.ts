import { CachedStorage, PropertyStorage } from "@shapescape/storage";
import { Module } from "../../module-manager";
import {
	Entity,
	EntityHealthComponent,
	Player,
	system,
	world,
} from "@minecraft/server";
import { TimerMechanic } from "./timer.mechanic";
import { Vec3 } from "@bedrock-oss/bedrock-boost";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { TimerScene } from "./timer.scene";
import { ButtonConfig } from "../main/main.service";
import { TimerEditScene } from "./timer-edit.scene";

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
	/** Game tick when the timer was started */
	startedAt: number;
	/** Game tick when the timer was paused (0 if not paused) */
	pausedAt: number;
	/** Total duration the timer has been paused (in ticks) */
	pauseDuration: number;
	/** Optional entity ID for the visual timer entity */
	entityId?: string;
	/** Whether the timer entity is currently visible */
	entityShown?: boolean;
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
	private timerMechanic: TimerMechanic;

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
		return this.storage.get("timer") as Timer | undefined;
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
			pausedAt: system.currentTick,
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

		// Calculate how long the timer was paused
		const pauseTime = system.currentTick - timer.pausedAt;

		this.updateTimer({
			isPaused: false,
			pausedAt: 0,
			pauseDuration: timer.pauseDuration + pauseTime,
		});
	}

	/**
	 * Calculates the remaining time in ticks for the current timer
	 * Takes into account pause duration for accurate calculation
	 * @returns Remaining time in ticks (0 if timer expired or doesn't exist)
	 */
	getRemainingTime(): number {
		const timer = this.getTimer();
		if (!timer) {
			return 0;
		}
		if (!timer.started) {
			return timer.duration * 20; // Full duration in ticks if not started
		}

		let elapsed: number;

		if (timer.isPaused) {
			// Calculate elapsed time up to when it was paused
			elapsed = timer.pausedAt - timer.startedAt - timer.pauseDuration;
		} else {
			// Calculate current elapsed time (excluding pause duration)
			elapsed = system.currentTick - timer.startedAt - timer.pauseDuration;
		}

		const totalDurationTicks = timer.duration * 20; // Convert seconds to ticks
		const remaining = totalDurationTicks - elapsed;

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
		// Set the started state and current tick as the start time
		this.updateTimer({
			started: true,
			startedAt: system.currentTick,
			isPaused: false,
			pausedAt: 0,
			pauseDuration: 0,
		});
		this.updateTimerEntity(); // Update the entity to reflect the new timer state
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
			const shouldShow = Math.floor(system.currentTick / 20) % 2 === 0;
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

		if (remainingTime / 20 < 11) {
			if (remainingTime < 20) {
				world.sendMessage([
					{
						translate: "edu_tools.message.timer.times_up",
					},
				]);
				world.getPlayers().forEach((player) => {
					player.playSound("random.anvil_use", { volume: 0.3, pitch: 2 });
				});
			} else {
				world.sendMessage([
					{
						translate: "edu_tools.message.timer.time_left",
						with: [this.formatTime(remainingTime)],
					},
					// select second or seconds based on remaining time
					remainingTime / 20 === 1
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
		this.updateEntityHealth(entity, remainingTime, timer.duration * 20);

		if (!timer.entityShown) {
			const player = world.getAllPlayers()[0]; // Get the first player
			if (player) {
				entity.teleport(Vec3.from(player.location).add(0, 1000, 0)); // Position above the player
			}
		}
	}

	/**
	 * Formats time in ticks to HH:MM:SS string
	 * @param ticks Time in game ticks
	 * @returns Formatted time string
	 */
	private formatTime(ticks: number): string {
		const seconds = Math.floor(ticks / 20);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		return `${hours}:${(minutes % 60).toString().padStart(2, "0")}:${(
			seconds % 60
		)
			.toString()
			.padStart(2, "0")}`;
	}

	/**
	 * Updates the entity's health component to represent timer progress
	 * @param entity The timer entity
	 * @param remainingTime Remaining time in ticks
	 * @param totalTime Total timer duration in ticks
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
