import { RawMessage, world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene, RawBodyElement } from "../scene_manager/ui-scene";
import { Timer, TimerDuration, TimerService } from "./timer.service";

export class TimerEditScene extends ModalUIScene {
	static readonly id = "edit_timer";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private readonly timerService: TimerService,
	) {
		super(TimerEditScene.id, context.getSourcePlayer());

		this.setContext(context);
		const timer = timerService.getTimer();

		const times = Object.values(TimerDuration)
			.filter((value): value is number => typeof value === "number")
			.map((durationValue) => {
				const hours = Math.floor(durationValue / 3600);
				const minutes = Math.floor((durationValue % 3600) / 60);
				const seconds = durationValue % 60;

				const stringBuilder: RawBodyElement[] = [];

				if (hours > 0) {
					stringBuilder.push({
						text: hours.toString() + " ",
					});
					if (hours > 1) {
						stringBuilder.push({
							translate: "edu_tools.ui.timer.time.hours",
						});
					} else {
						stringBuilder.push({
							translate: "edu_tools.ui.timer.time.hour",
						});
					}
					stringBuilder.push({
						text: " ",
					});
				}
				if (minutes > 0) {
					stringBuilder.push({
						text: minutes.toString() + " ",
					});
					if (minutes > 1) {
						stringBuilder.push({
							translate: "edu_tools.ui.timer.time.minutes",
						});
					} else {
						stringBuilder.push({
							translate: "edu_tools.ui.timer.time.minute",
						});
					}
					stringBuilder.push({
						text: " ",
					});
				}
				if (seconds > 0) {
					stringBuilder.push({
						text: seconds.toString() + " ",
					});
					if (seconds > 1) {
						stringBuilder.push({
							translate: "edu_tools.ui.timer.time.seconds",
						});
					} else {
						stringBuilder.push({
							translate: "edu_tools.ui.timer.time.second",
						});
					}
				}

				const rawMessage: RawMessage = {
					rawtext: stringBuilder,
				};
				return rawMessage;
			});

		this.addDropdown(
			"edu_tools.ui.timer_edit.time",
			times,
			(selectedIndex: number): void => {
				const selectedTime = Object.values(TimerDuration).filter(
					(value): value is number => typeof value === "number",
				)[selectedIndex];
				context.setData("timer_duration", selectedTime);
			},
			{
				defaultValueIndex: timer
					? Object.values(TimerDuration)
							.filter((value): value is number => typeof value === "number")
							.indexOf(timer.duration)
					: 0,
				tooltip: "edu_tools.ui.timer_edit.time_tooltip",
			},
		);

		this.addToggle(
			"edu_tools.ui.timer_edit.show_timer_entity",
			(value: boolean): void => {
				context.setData("show_timer", value);
			},
			{
				defaultValue: timer ? !!timer.entityShown : true,
				tooltip: "edu_tools.ui.timer_edit.show_timer_entity_tooltip",
			},
		);

		this.show(context.getSourcePlayer(), sceneManager).then((r) => {
			if (!r.canceled) {
				this.applyChanges(context);

				sceneManager.goBackToScene(context, "timer");
			}
		});
	}

	private applyChanges(context: SceneContext): void {
		const duration = context.getData("timer_duration") || 60;
		const showTimer = context.getData("show_timer") || true;
		const timer: Partial<Timer> = {
			duration: duration,
			entityShown: showTimer,
		};

		if (this.timerService.getTimer()) {
			this.timerService.updateTimer(timer);
		} else {
			// If no timer exists, create a new one
			// This will create a new timer with the provided name, description, and duration
			this.timerService.newTimer(timer, context.getSourcePlayer());
		}
	}
}
