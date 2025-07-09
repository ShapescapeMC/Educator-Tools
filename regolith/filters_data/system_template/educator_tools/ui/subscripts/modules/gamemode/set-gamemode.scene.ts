import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { GamemodeService } from "./gamemode.service";
import { Team } from "../teams/interfaces/team.interface";
import { SceneContext } from "../scene_manager/scene-context";
import { ModuleManager } from "../../module-manager";
import { GameMode } from "@minecraft/server";

export class SetGamemodeScene extends ActionUIScene {
	public static readonly id = "set_gamemode";
	private gamemodeService: GamemodeService;

	constructor(sceneManager: SceneManager, context: SceneContext) {
		// Create the scene
		super(SetGamemodeScene.id, context.getSourcePlayer());
		this.context = context;

		// Get the gamemode service
		this.gamemodeService =
			ModuleManager.getInstance().getModule<GamemodeService>(
				GamemodeService.id,
			)!;

		// Get the target team
		const subjectTeam = context.getSubjectTeam()!;
		this.setRawBody([
			{
				translate: "edu_tools.ui.set_gamemode.team.body",
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
				translate: "edu_tools.ui.set_gamemode.team.body2",
			},
		]);

		// Add gamemode buttons
		this.addGamemodeButtons(sceneManager, subjectTeam);

		// Pass the context to the scene to handle navigation
		this.setContext(context);
		this.show(context.getSourcePlayer(), sceneManager);
	}

	private addGamemodeButtons(
		sceneManager: SceneManager,
		subjectTeam: Team,
	): void {
		Object.values(GameMode).forEach((gamemode) => {
			this.addButton(
				"edu_tools.ui.set_gamemode.buttons." + gamemode.toLowerCase(),
				(): void => {
					this.applyGamemode(gamemode.toLowerCase(), sceneManager, subjectTeam);
				},
				"textures/edu_tools/ui/icons/set_gamemode/" + gamemode.toLowerCase(),
			);
		});
	}

	private applyGamemode(
		gamemode: string,
		sceneManager: SceneManager,
		subjectTeam: Team,
	): void {
		// Apply gamemode to team
		this.gamemodeService.setTeamGamemode(subjectTeam, gamemode);

		const configTeam = {
			title: "confirm.gamemode",
			body: "edu_tools.ui.confirm.gamemode.team.body",
			buttons: [
				{
					label: "edu_tools.ui.buttons.continue",
					handler: (context: SceneContext, manager: SceneManager) => {
						context.clearHistory();
						manager.openSceneWithContext(context, "main", true);
					},
				},
				{
					label: "edu_tools.ui.buttons.exit",
					handler: () => {},
				},
			],
		};
		sceneManager.openSceneWithContext(
			this.context!,
			"confirm",
			false,
			configTeam,
		);
	}
}
