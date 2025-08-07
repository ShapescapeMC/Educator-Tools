import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { TeamsService } from "./teams.service";

// TeamSelectScene handles the UI for selecting a team (subject or target) in the educator tools module
export class TeamSelectScene extends ActionUIScene {
	static readonly id = "team_select";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		teamsService: TeamsService,
	) {
		// Call parent constructor with scene id and source player
		super(TeamSelectScene.id, context.getSourcePlayer());

		// Store the context for later use
		this.setContext(context);
		// Set the body text depending on which team selection is required
		this.setBodyByContext(context);

		const teamFilter = context.getData("team_filter");
		const teamFilterSubject = context.getData("team_filter_subject");
		const teamFilterTarget = context.getData("team_filter_target");

		// For each team, add a button to the UI
		teamsService.getAllTeams().forEach((team) => {
			// Determine which filter to apply based on context state
			let shouldSkipTeam = false;

			if (context.isSubjectTeamRequired() && teamFilterSubject) {
				shouldSkipTeam = !teamFilterSubject(team, teamsService);
			} else if (
				!context.isSubjectTeamRequired() &&
				context.isTargetTeamRequired() &&
				teamFilterTarget
			) {
				shouldSkipTeam = !teamFilterTarget(team, teamsService);
			} else if (teamFilter) {
				shouldSkipTeam = !teamFilter(team, teamsService);
			}

			if (shouldSkipTeam) {
				return; // Skip this team if it doesn't pass the filter
			}

			let buttonText = "edu_tools.ui.team.name." + team.id;
			if (
				!teamsService.isSystemTeam(team.id) ||
				teamsService.isPlayerTeam(team.id)
			) {
				buttonText = team.name;
			}
			if (
				!context.isSubjectTeamRequired() &&
				context.isTargetTeamRequired() &&
				team.memberIds.length > 1
			) {
				return; // Target team selection only includes teams with a single member
			}
			let iconPath =
				"textures/edu_tools/ui/icons/teams/" + (team.icon || team.id);
			if (!team.isSystem) {
				// If the team is not a system team, use the team's icon if available
				iconPath = "textures/edu_tools/ui/icons/generic/" + team.icon;
			}
			this.addButton(
				buttonText,
				() => this.handleTeamButton(sceneManager, context, team),
				// Set the icon for the team button
				iconPath,
			);
		});

		if (!context.isSubjectTeamRequired() && !context.isTargetTeamRequired()) {
			context.setData("team_filter", undefined);
		}

		this.show(context.getSourcePlayer(), sceneManager);
	}

	// Set the body text based on which team is required
	private setBodyByContext(context: SceneContext): void {
		let bodyKey = context.getData("body_key");
		if (bodyKey) {
			if (context.isSubjectTeamRequired()) {
				bodyKey = "edu_tools.ui." + bodyKey + ".team_select.get_subject.body";
			} else if (context.isTargetTeamRequired()) {
				bodyKey = "edu_tools.ui." + bodyKey + ".team_select.get_target.body";
			}
		}

		if (context.isSubjectTeamRequired()) {
			this.setSimpleBody(
				bodyKey || "edu_tools.ui.team_select.get_subject.body",
			);
		} else if (context.isTargetTeamRequired()) {
			this.setSimpleBody(bodyKey || "edu_tools.ui.team_select.get_target.body");
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
