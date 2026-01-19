import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { ClassroomLimitationsService } from "./classroom-limitations.service";

/**
 * UI Scene for Classroom Limitations
 * Renders toggles for each restriction (items and entities).
 */
export class ClassroomLimitationsScene extends ModalUIScene {
	constructor(
		sceneManager: SceneManager,
		context: any,
		private service: ClassroomLimitationsService,
	) {
		super("classroom_limitations", context.getSourcePlayer(), "main");

		this.addLabel({
			translate: "edu_tools.ui.classroom_limitations.body",
		});
		this.addDivider();

		this.addLabel({
			translate: "edu_tools.ui.classroom_limitations.body.items",
		});
		// Add toggles dynamically based on service definitions for items
		for (const lim of this.service.getItemLimitations()) {
			const translationKey = `edu_tools.ui.classroom_limitations.toggles.${lim.key}`;
			this.addToggle(
				translationKey,
				(value: boolean) => {
					this.service.setRestriction(lim.key, value);
				},
				{
					defaultValue: this.service.isRestrictionEnabled(lim.key),
					tooltip: `${translationKey}_tooltip`,
				},
			);
		}

		this.addLabel({
			translate: "edu_tools.ui.classroom_limitations.body.entities",
		});
		// Add toggles for entity limitations
		for (const lim of this.service.getEntityLimitations()) {
			const translationKey = `edu_tools.ui.classroom_limitations.toggles.${lim.key}`;
			this.addToggle(
				translationKey,
				(value: boolean) => {
					this.service.setRestriction(lim.key, value);
				},
				{
					defaultValue: this.service.isRestrictionEnabled(lim.key),
					tooltip: `${translationKey}_tooltip`,
				},
			);
		}

		this.show(context.getSourcePlayer(), sceneManager).then((r) => {
			if (!r.canceled) {
				sceneManager.goBack(context, 1); // Go back to previous scene
				this.service.onSettingsUpdated();
			}
		});
	}
}
