import { Player, world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { TeamsService } from "./teams.service";

// TeamSelectScene handles the UI for selecting a team (subject or target) in the educator tools module
export class TeamSelectScene extends ActionUIScene {
	static readonly id = "team_select";

	constructor(sceneManager: SceneManager, context: SceneContext) {
		// Call parent constructor with scene id and source player
		super(TeamSelectScene.id, context.getSourcePlayer());

		// Store the context for later use
		this.setContext(context);
		// Set the body text depending on which team selection is required
		this.setBodyByContext(context);

		// Get the TeamsService module to access team data
		const teamsService = sceneManager
			.getModuleManager()
			.getModule("teams") as TeamsService;

		const teamFilter = context.getData("team_filter");

		// For each team, add a button to the UI
		teamsService.getAllTeams().forEach((team) => {
			// If a team filter is defined, apply it
			if (
				teamFilter &&
				teamFilter instanceof Function &&
				!teamFilter(team, this)
			) {
				return; // Skip teams that do not match the filter
			}
			let buttonText = "edu_tools.ui.team.name." + team.id;
			if (teamsService.isSystemTeam(team.id)) {
				if (teamsService.isPlayerTeam(team.id)) {
					const player = world.getEntity(team.memberIds[0]) as Player;
					buttonText = player.name;
					team.icon = "player";
				}
			} else {
				buttonText = team.name;
			}
			if (
				!context.isSubjectTeamRequired() &&
				context.isTargetTeamRequired() &&
				team.memberIds.length > 1
			) {
				return; // Target team selection only includes teams with a single member
			}
			this.addButton(
				buttonText,
				() => this.handleTeamButton(sceneManager, context, team),
				// Set the icon for the team button
				"textures/edu_tools/ui/icons/teams/" + (team.icon || team.id),
			);
		});

		if (!context.isSubjectTeamRequired() && !context.isTargetTeamRequired()) {
			context.setData("team_filter", undefined);
		}

		this.show(context.getSourcePlayer(), sceneManager);
	}

	// Set the body text based on which team is required
	private setBodyByContext(context: SceneContext): void {
		if (context.isSubjectTeamRequired()) {
			this.setSimpleBody("edu_tools.ui.team_select.get_subject.body");
		} else if (context.isTargetTeamRequired()) {
			this.setSimpleBody("edu_tools.ui.team_select.get_target.body");
		} else {
			console.warn(
				"TeamSelectScene: Neither get_subject nor get_target is set in context data.",
			);
			this.setSimpleBody("edu_tools.ui.team_select.default.body");
		}
	}

	// Handle logic when a team button is pressed
	private handleTeamButton(
		sceneManager: SceneManager,
		context: SceneContext,
		team: any,
	): void {
		// If subject team is required, set it and check if target team is next
		if (context.isSubjectTeamRequired()) {
			context.setSubjectTeam(team);
			context.setSubjectTeamRequired(false);
			if (context.isTargetTeamRequired()) {
				sceneManager.openSceneWithContext(context, TeamSelectScene.id, false);
				return;
			}
		} else if (context.isTargetTeamRequired()) {
			// If target team is required, set it
			context.setTargetTeam(team);
			context.setTargetTeamRequired(false);
		}
		// Get the next scene to open from context
		const nextScene = context.getNextScene();
		if (!nextScene || !nextScene[0] || nextScene.length < 2) {
			console.error(
				"TeamSelectScene: No or invalid next scene defined in context.",
			);
			return;
		}
		// Open the next scene with the updated context
		sceneManager.openSceneWithContext(
			context,
			nextScene[0],
			true,
			nextScene[1],
		);
	}
}
