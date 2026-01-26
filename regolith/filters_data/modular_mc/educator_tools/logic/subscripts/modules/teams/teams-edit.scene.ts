import { RawMessage } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { TeamsService } from "./teams.service";

export class TeamsEditScene extends ModalUIScene {
	static readonly id = "teams_edit";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private readonly teamsService: TeamsService,
	) {
		super(TeamsEditScene.id, context.getSourcePlayer());

		this.setContext(context);
		const subjectTeam = context.getSubjectTeam();

		this.addTextField(
			"edu_tools.ui.teams_edit.name",
			"edu_tools.ui.teams_edit.name_placeholder",
			(value: string): void => {
				context.setData("team_name", value);
			},
			{
				defaultValue: subjectTeam ? subjectTeam.name : "",
				tooltip: "edu_tools.ui.teams_edit.name_tooltip",
			},
		);

		this.addTextField(
			"edu_tools.ui.teams_edit.description",
			"edu_tools.ui.teams_edit.description_placeholder",
			(value: string): void => {
				context.setData("team_description", value);
			},
			{
				defaultValue: subjectTeam ? subjectTeam.description : "",
				tooltip: "edu_tools.ui.teams_edit.description_tooltip",
			},
		);

		const iconsKeys: RawMessage[] = TeamsService.availableIcons.map(
			(icon) =>
				({
					translate: `edu_tools.ui.teams_edit.icon.options.${icon.toLowerCase()}`,
				} as const),
		);

		this.addDropdown(
			"edu_tools.ui.teams_edit.icon",
			iconsKeys,
			(selectedIcon: number): void => {
				context.setData("team_icon", TeamsService.availableIcons[selectedIcon]);
			},
			{
				defaultValueIndex: subjectTeam?.icon
					? TeamsService.availableIcons.indexOf(subjectTeam.icon)
					: Math.floor(Math.random() * TeamsService.availableIcons.length),
				tooltip: "edu_tools.ui.teams_edit.icon_tooltip",
			},
		);

		this.show(context.getSourcePlayer(), sceneManager).then((r) => {
			if (r.canceled) {
				return;
			}
			this.applyChanges(context);
			sceneManager.openSceneWithContext(context, "teams_manage_players", true);
		});
	}

	private applyChanges(context: SceneContext): void {
		const subjectTeam = context.getSubjectTeam();
		const name = context.getData("team_name") || "New Team";
		if (!subjectTeam) {
			const id =
				name.toLowerCase().replace(/\s+/g, "_") +
				"_" +
				Math.random().toString(36).substring(2, 15);
			const team = this.teamsService.createTeam(id, name, {
				description: context.getData("team_description") || "",
				icon: context.getData("team_icon") || TeamsService.availableIcons[0],
			});
			context.setSubjectTeam(team);
		} else {
			const team = this.teamsService.updateTeam(subjectTeam.id, {
				name: name,
				description: context.getData("team_description") || "",
				icon: context.getData("team_icon") || TeamsService.availableIcons[0],
			});
			context.setSubjectTeam(team);
		}
	}
}
