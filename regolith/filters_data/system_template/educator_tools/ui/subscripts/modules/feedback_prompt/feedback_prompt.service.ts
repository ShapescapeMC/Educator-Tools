import { Module, ModuleManager } from "../../module-manager";
import { ItemService } from "../item/item.service";
import { TeamsService } from "../teams/teams.service";

export class FeedbackPromptService implements Module {
	readonly id = "feedback_prompt";
	static readonly id = "feedback_prompt";
	private itemService: ItemService | undefined;
	private teamsService: TeamsService | undefined;

	private playersToPrompt: Map<string, Date> = new Map();
	private worldInitDate: Date = new Date();

	constructor(private readonly moduleManager: ModuleManager) {}

	initialize?(): void {
		this.teamsService = this.moduleManager.getModule(
			TeamsService.id,
		) as TeamsService;
		this.itemService = this.moduleManager.getModule(
			ItemService.id,
		) as ItemService;

		this.itemService?.registerScene("non_existent_scene", {
			priority: 10000,
			condition_callback: (player) => {
				const teacherTeam = this.teamsService?.getTeam(
					TeamsService.TEACHERS_TEAM_ID,
				);
				if (
					teacherTeam?.memberIds.includes(player.id) &&
					!this.playersToPrompt.has(player.id)
				) {
					const promptDate = new Date();
					this.playersToPrompt.set(player.id, promptDate);
				}

				return false;
			},
		});
	}

	checkIfPlayerShouldBePrompted(playerId: string): boolean {
		// Check if the player has been marked for prompting at least 5 minutes ago, and the game session was at least 10 minutes
		const promptDate = this.playersToPrompt.get(playerId);
		if (!promptDate) return false;
		const currentTime = new Date();
		const timeSincePrompt =
			(currentTime.getTime() - promptDate.getTime()) / 1000 / 60; // in minutes
		const timeSinceWorldInit =
			(currentTime.getTime() - this.worldInitDate.getTime()) / 1000 / 60; // in minutes
		return timeSincePrompt >= 5 && timeSinceWorldInit >= 10;
	}

	getPlayersToPrompt(): Map<string, Date> {
		return this.playersToPrompt;
	}
}
