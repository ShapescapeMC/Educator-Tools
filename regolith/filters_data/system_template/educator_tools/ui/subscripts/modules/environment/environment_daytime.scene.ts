import { TimeOfDay } from "@minecraft/server";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { EnvironmentService } from "./environment.service";

export class EnvironmentDaytimeScene extends ModalUIScene {
	static readonly id = "environment_daytime";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		environmentService: EnvironmentService,
	) {
		super(EnvironmentDaytimeScene.id, context.getSourcePlayer());

		this.setContext(context);

		const daytimes = Object.keys(TimeOfDay).filter((key) => isNaN(Number(key)));
		const dayTimeLangKeys = daytimes.map((daytime) => ({
			translate: `edu_tools.ui.environment_daytime.select_daytime.options.${daytime.toLowerCase()}`,
		}));
		// Add a "no change" option
		dayTimeLangKeys.unshift({
			translate:
				"edu_tools.ui.environment_weather.select_weather.options.no_change",
		});

		this.addDropdown(
			"edu_tools.ui.environment_daytime.select_daytime",
			dayTimeLangKeys,
			(selectedDaytime: number): void => {
				if (selectedDaytime === 0) {
					// If "no change" is selected, do nothing
					return;
				}
				environmentService.setDayTime(
					TimeOfDay[daytimes[selectedDaytime] as keyof typeof TimeOfDay],
				);
			},
			{
				tooltip: "edu_tools.ui.environment_daytime.select_daytime_tooltip",
			},
		);

		this.addToggle(
			"edu_tools.ui.environment_daytime.set_daytime_cycle",
			(isEnabled: boolean): void => {
				environmentService.setDayLightCycle(isEnabled);
			},
			{
				defaultValue: environmentService.getDayLightCycle(),
				tooltip: "edu_tools.ui.environment_daytime.set_daytime_cycle_tooltip",
			},
		);

		this.show(context.getSourcePlayer(), sceneManager).then((r) => {
			if (r.canceled) return;
			sceneManager.goBackToScene(context, "environment");
		});
	}
}
