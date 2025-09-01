import { RawMessage } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { Team } from "../teams/interfaces/team.interface";
import { AssignmentService } from "./assignment.service";

export class AssignmentCreateScene extends ModalUIScene {
	static readonly id = "assignment_create";

	constructor(sceneManager: SceneManager, context: SceneContext) {
		super(AssignmentCreateScene.id, context.getSourcePlayer());

		this.setContext(context);

		const assignment = context.getData("assignment");
		if (assignment) {
			this.addLabel({
				rawtext: [
					{ translate: "edu_tools.ui.assignment_create.body.edit" },
					{ text: " §9" },
					{ text: context.getSubjectTeam()!.name },
					{ text: " §r" },
				],
			});
		} else {
			this.addLabel({
				translate: "edu_tools.ui.assignment_create.body",
			});
		}

		this.addTextField(
			"edu_tools.ui.assignment_create.name",
			"edu_tools.ui.assignment_create.name_placeholder",
			(value: string): void => {
				context.setData("assignment_title", value);
			},
			{
				defaultValue: assignment ? assignment.title : "",
				tooltip: "edu_tools.ui.assignment_create.name_tooltip",
			},
		);
		this.addTextField(
			"edu_tools.ui.assignment_create.description",
			"edu_tools.ui.assignment_create.description_placeholder",
			(value: string): void => {
				context.setData("assignment_description", value);
			},
			{
				defaultValue: assignment ? assignment.description : "",
				tooltip: "edu_tools.ui.assignment_create.description_tooltip",
			},
		);

		if (!assignment) {
			this.addToggle(
				"edu_tools.ui.assignment_create.toggles.notify",
				(value: boolean): void => {
					context.setData("assignment_notify", value);
				},
				{
					defaultValue: true,
					tooltip: "edu_tools.ui.assignment_create.toggles.notify_tooltip",
				},
			);

			const iconsKeys: RawMessage[] = AssignmentService.availableIcons.map(
				(icon) =>
					({
						translate: `edu_tools.ui.assignment_create.icon.options.${icon.toLowerCase()}`,
					} as const),
			);

			this.addDropdown(
				"edu_tools.ui.assignment_create.icon",
				iconsKeys,
				(selectedIcon: number): void => {
					context.setData("team_icon", selectedIcon);
				},
				{
					defaultValueIndex: assignment?.icon
						? AssignmentService.availableIcons.indexOf(assignment.icon)
						: Math.floor(
								Math.random() * AssignmentService.availableIcons.length,
						  ),
					tooltip: "edu_tools.ui.assignment_create.icon_tooltip",
				},
			);

			this.show(context.getSourcePlayer(), sceneManager).then((r) => {
				if (r.canceled) {
					return;
				}
				if (!assignment) {
					context.setSubjectTeamRequired(true);
					context.setNextScene("assignment_created");
					context.setData("team_filter", (team: Team): boolean => {
						return true;
					});
					sceneManager.openSceneWithContext(context, "team_select", true);
				} else {
					sceneManager.openSceneWithContext(
						context,
						"assignment_created",
						true,
					);
				}
			});
		}
	}
}
