import { TimeOfDay, WeatherType, world } from "@minecraft/server";
import { Module } from "../../module-manager";
import { EnvironmentScene } from "./environment.scene";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { EnvironmentWeatherScene } from "./environment_weather.scene";
import { EnvironmentDaytimeScene } from "./environment_daytime.scene";
import { PropertyStorage } from "@shapescape/storage";
import { EnvironmentMechanic } from "./environment.mechanic";

/**
 * Service module for managing world environment settings including weather, time of day, and day/night cycles.
 * Provides controls for setting weather conditions, daytime cycles, and real-time daylight synchronization.
 */
export class EnvironmentService implements Module {
	readonly id: string = "environment";
	public static readonly id = "environment";
	private readonly storage: PropertyStorage;
	private readonly environmentMechanic: EnvironmentMechanic;

	/**
	 * Creates a new EnvironmentService instance.
	 * @param storage - The property storage system for persisting environment settings
	 */
	constructor(storage: PropertyStorage) {
		this.storage = storage.getSubStorage(EnvironmentService.id);
		this.environmentMechanic = new EnvironmentMechanic(this);
	}

	/**
	 * Initializes the environment service and starts the environment mechanic.
	 */
	/**
	 * Initializes the environment service and starts the environment mechanic.
	 */
	initialize(): void {
		this.environmentMechanic.initialize();
	}

	/**
	 * Registers all environment-related scenes with the scene manager.
	 * @param sceneManager - The scene manager to register scenes with
	 */
	registerScenes(sceneManager: SceneManager): void {
		sceneManager.registerScene(
			EnvironmentScene.id,
			(manager: SceneManager, context: SceneContext) => {
				new EnvironmentScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			"environment_daytime",
			(manager: SceneManager, context: SceneContext) => {
				new EnvironmentDaytimeScene(manager, context, this);
			},
		);
		sceneManager.registerScene(
			"environment_weather",
			(manager: SceneManager, context: SceneContext) => {
				new EnvironmentWeatherScene(manager, context, this);
			},
		);
	}

	/**
	 * Sets the weather type in the overworld dimension.
	 * @param weatherType - The weather type to set (e.g., Clear, Rain, Thunder)
	 */
	setWeather(weatherType: WeatherType): void {
		world.getDimension("overworld").setWeather(weatherType);
	}

	/**
	 * Sets the time of day in the world.
	 * @param time - The time value in ticks (0-24000, where 0 is sunrise)
	 */
	setDayTime(time: number): void {
		world.setTimeOfDay(time);
	}

	/**
	 * Gets the current time of day in the world.
	 * @returns The current time value in ticks
	 */
	getDayTime(): number {
		return world.getTimeOfDay();
	}

	/**
	 * Checks if the daylight cycle game rule is enabled.
	 * @returns True if the daylight cycle is enabled, false otherwise
	 */
	getDayLightCycle(): boolean {
		return world.gameRules.doDayLightCycle;
	}

	/**
	 * Sets the daylight cycle game rule.
	 * @param dayLightCycle - Whether to enable the daylight cycle
	 */
	setDayLightCycle(dayLightCycle: boolean): void {
		world.gameRules.doDayLightCycle = dayLightCycle;
	}

	/**
	 * Checks if the weather cycle game rule is enabled.
	 * @returns True if the weather cycle is enabled, false otherwise
	 */
	getWeatherCycle(): boolean {
		return world.gameRules.doWeatherCycle;
	}

	/**
	 * Sets the weather cycle game rule.
	 * @param weatherCycle - Whether to enable the weather cycle
	 */
	setWeatherCycle(weatherCycle: boolean): void {
		world.gameRules.doWeatherCycle = weatherCycle;
	}

	/**
	 * Enables or disables real-time daylight synchronization.
	 * When enabled, the game time matches the real-world time.
	 * @param value - Whether to enable real-time daylight
	 */
	setRealTimeDaylight(value: boolean): void {
		if (value) {
			this.setDayLightCycle(!value);
		}
		this.storage.set("real_time_daylight", value);
	}

	/**
	 * Checks if real-time daylight synchronization is enabled.
	 * @returns True if real-time daylight is enabled, false otherwise
	 */
	isRealTimeDaylight(): boolean {
		return this.storage.get("real_time_daylight", false);
	}

	/**
	 * Sets the world to permanent daytime with clear weather.
	 * Disables both daylight and weather cycles, sets time to noon, and clears weather.
	 */
	alwaysDay(): void {
		this.setDayLightCycle(false);
		this.setWeatherCycle(false);
		this.setDayTime(TimeOfDay.Noon); // Set time to day
		this.setWeather(WeatherType.Clear); // Set weather to clear
		this.setRealTimeDaylight(false);
	}
}
