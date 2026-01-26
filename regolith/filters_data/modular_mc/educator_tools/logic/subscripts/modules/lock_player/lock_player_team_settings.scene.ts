import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { LockPlayerService } from "./lock_player.service";

export class LockPlayerTeamSettingsScene extends ActionUIScene {
	static readonly id = "lock_player_team_settings";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private readonly lockPlayerService: LockPlayerService,
	) {
		super(LockPlayerTeamSettingsScene.id, context.getSourcePlayer());

		this.setContext(context);

		const subjectTeam = context.getSubjectTeam()!;
		this.setRawBody([
			{
				translate: "edu_tools.ui.lock_player.team.body.1",
			},
			{
				text: " §9",
			},
			{
				text: subjectTeam.name,
			},
			{
				text: " §r",
			},
			{
				translate: "edu_tools.ui.lock_player.team.body.2",
			},
		]);

		const currentLock = this.lockPlayerService.getLockSettings(subjectTeam.id);

		this.addButton(
			"edu_tools.ui.lock_player_team_settings.button.settings",
			() => {
				sceneManager.openSceneWithContext(context, "lock_player_team", true);
			},
			"textures/edu_tools/ui/icons/lock_player/settings",
		);
		if (!currentLock?.playerBound) {
			this.addButton(
				"edu_tools.ui.lock_player_team_settings.button.update_center",
				() => {
					this.lockPlayerService.updateLockSettings(subjectTeam.id, {
						center: context.getSourcePlayer().location,
					});
					this.player.sendMessage({
						translate:
							"edu_tools.message.lock_player_team_settings.update_center",
					});
				},
				"textures/edu_tools/ui/icons/lock_player/update_center",
			);
		}
		this.addButton(
			"edu_tools.ui.lock_player_team_settings.button.teleport_to_center",
			() => {
				this.lockPlayerService.teleportToCenter(subjectTeam.id);
				this.player.sendMessage({
					translate:
						"edu_tools.message.lock_player_team_settings.teleport_to_center",
				});
			},
			"textures/edu_tools/ui/icons/lock_player/teleport_to_center",
		);
		this.addButton(
			"edu_tools.ui.lock_player_team_settings.button.delete_lock",
			() => {
				this.lockPlayerService.clearLockSettings(subjectTeam.id);
				this.player.sendMessage({
					translate: "edu_tools.message.lock_player_team_settings.delete_lock",
				});
				sceneManager.goBackToScene(context, "lock_player_team");
			},
			"textures/edu_tools/ui/icons/lock_player/delete_lock",
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
