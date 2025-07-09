import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { TimerService } from "./timer.service";

export class TimerScene extends ActionUIScene {
	static readonly id = "timer";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		timerService: TimerService,
	) {
		super(TimerScene.id, context.getSourcePlayer());

		this.setContext(context);
		this.setSimpleBody("edu_tools.ui.timer.body");
		const timer = timerService.getTimer();

		if (timer) {
			if (!timer.started) {
				this.addButton(
					"edu_tools.ui.timer.buttons.start",
					(): void => {
						timerService.startTimer();
					},
					"textures/edu_tools/ui/icons/timer/start_timer",
				);
			} else if (timer.isPaused) {
				this.addButton(
					"edu_tools.ui.timer.buttons.resume",
					(): void => {
						timerService.resumeTimer();
					},
					"textures/edu_tools/ui/icons/timer/resume_timer",
				);
			} else {
				this.addButton(
					"edu_tools.ui.timer.buttons.pause",
					(): void => {
						timerService.pauseTimer();
					},
					"textures/edu_tools/ui/icons/timer/pause_timer",
				);
			}

			this.addButton(
				"edu_tools.ui.timer.buttons.edit",
				(): void => {
					sceneManager.openSceneWithContext(context, "edit_timer", true);
				},
				"textures/edu_tools/ui/icons/timer/edit_timer",
			);
			this.addButton(
				"edu_tools.ui.timer.buttons.remove",
				(): void => {
					timerService.clearTimer();
				},
				"textures/edu_tools/ui/icons/timer/remove_timer",
			);
		} else {
			this.addButton(
				"edu_tools.ui.timer.buttons.create",
				(): void => {
					sceneManager.openSceneWithContext(context, "edit_timer", true);
				},
				"textures/edu_tools/ui/icons/timer/create_timer",
			);
		}

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
