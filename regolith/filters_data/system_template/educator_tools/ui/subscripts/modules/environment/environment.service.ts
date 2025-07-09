import { TimeOfDay, WeatherType, world } from "@minecraft/server";
import { Module } from "../../module-manager";
import { EnvironmentScene } from "./environment.scene";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { EnvironmentWeatherScene } from "./environment_weather.scene";
import { EnvironmentDaytimeScene } from "./environment_daytime.scene";

export class EnvironmentService implements Module {
	readonly id: string = "environment";

	constructor() {}

	registerScenes(sceneManager: any): void {
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

	setWeather(weatherType: WeatherType): void {
		world.getDimension("overworld").setWeather(weatherType);
	}

	setDayTime(time: number): void {
		world.setTimeOfDay(time);
	}

	getDayTime(): number {
		return world.getTimeOfDay();
	}

	getDayLightCycle(): boolean {
		return world.gameRules.doDayLightCycle;
	}

	setDayLightCycle(dayLightCycle: boolean): void {
		world.gameRules.doDayLightCycle = dayLightCycle;
	}

	getWeatherCycle(): boolean {
		return world.gameRules.doWeatherCycle;
	}

	setWeatherCycle(weatherCycle: boolean): void {
		world.gameRules.doWeatherCycle = weatherCycle;
	}

	alwaysDay(): void {
		this.setDayLightCycle(false);
		this.setWeatherCycle(false);
		this.setDayTime(TimeOfDay.Noon); // Set time to day
	}
}
