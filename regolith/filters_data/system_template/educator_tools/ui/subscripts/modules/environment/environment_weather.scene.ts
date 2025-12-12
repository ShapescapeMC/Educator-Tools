import { WeatherType } from "@minecraft/server";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { EnvironmentService } from "./environment.service";

/**
 * Modal scene for configuring weather settings including weather type and weather cycle.
 * Provides options to set specific weather conditions and toggle the weather cycle on or off.
 */
export class EnvironmentWeatherScene extends ModalUIScene {
	static readonly id = "environment_weather";

	/**
	 * Creates a new EnvironmentWeatherScene with controls for weather settings.
	 * @param sceneManager - The scene manager for handling scene navigation
	 * @param context - The scene context containing player and navigation history
	 * @param environmentService - The environment service for managing weather settings
	 */
	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		environmentService: EnvironmentService,
	) {
		super(EnvironmentWeatherScene.id, context.getSourcePlayer());

		this.setContext(context);

		const weatherTypes = Object.keys(WeatherType).filter((key) =>
			isNaN(Number(key)),
		);
		const weatherTypesLangKeys = weatherTypes.map((weather) => ({
			translate: `edu_tools.ui.environment_weather.select_weather.options.${weather.toLowerCase()}`,
		}));
		// Add a "no change" option
		weatherTypesLangKeys.unshift({
			translate:
				"edu_tools.ui.environment_weather.select_weather.options.no_change",
		});

		this.addDropdown(
			"edu_tools.ui.environment_weather.select_weather",
			weatherTypesLangKeys,
			(selectedWeather: number): void => {
				if (selectedWeather === 0) {
					// If "no change" is selected, do nothing
					return;
				}
				environmentService.setWeather(
					WeatherType[
						weatherTypes[selectedWeather] as keyof typeof WeatherType
					],
				);
			},
			{
				tooltip: "edu_tools.ui.environment_weather.select_weather_tooltip",
			},
		);

		this.addToggle(
			"edu_tools.ui.environment_weather.set_weather_cycle",
			(isEnabled: boolean): void => {
				environmentService.setWeatherCycle(isEnabled);
			},
			{
				defaultValue: environmentService.getWeatherCycle(),
				tooltip: "edu_tools.ui.environment_weather.set_weather_cycle_tooltip",
			},
		);

		this.show(context.getSourcePlayer(), sceneManager).then((r) => {
			if (r.canceled) return;
			sceneManager.goBackToScene(context, "environment");
		});
	}
}
