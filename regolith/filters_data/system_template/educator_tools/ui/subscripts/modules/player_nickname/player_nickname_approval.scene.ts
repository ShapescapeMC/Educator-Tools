import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { TeamsService } from "../teams/teams.service";
import { PlayerNicknameService } from "./player_nickname.service";

export class PlayerNicknameApprovalScene extends ModalUIScene {
	static readonly id = "player_nickname_approval";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private readonly playerNicknameService: PlayerNicknameService,
		private readonly teamService: TeamsService,
	) {
		super(PlayerNicknameApprovalScene.id, context.getSourcePlayer());
		this.setContext(context);

		const pendingNicknames =
			this.playerNicknameService.getNicknameApprovalRequests();

		if (pendingNicknames.length === 0) {
			this.addLabel({
				translate: "edu_tools.ui.player_nickname_approval.no_pending",
			});
		} else {
			pendingNicknames.forEach((request) => {
				const [[playerId, nickname]] = Object.entries(request);
				const requestingPlayerTeam =
					this.teamService.getPlayerIndividualTeam(playerId);
				this.addToggle(
					{
						translate: "edu_tools.ui.player_nickname_approval.request_body",
						with: [
							nickname,
							requestingPlayerTeam ? requestingPlayerTeam.name : "",
						],
					},
					(approved: boolean) => {
						if (approved) {
							this.playerNicknameService.approveNickname(playerId);
						} else {
							this.playerNicknameService.removeNicknameApprovalRequest(
								playerId,
							);
						}
					},
					{
						defaultValue: true,
					},
				);
			});
		}

		const response = this.show(context.getSourcePlayer(), sceneManager);
		response.then((r) => {
			if (r.canceled) {
				return;
			}
			if (context.getHistory().length > 0) {
				sceneManager.goBackToScene(context, "player_nickname_teacher");
			} else {
				sceneManager.createContextAndOpenScene(
					context.getSourcePlayer(),
					"main",
				);
			}
		});
	}
}
