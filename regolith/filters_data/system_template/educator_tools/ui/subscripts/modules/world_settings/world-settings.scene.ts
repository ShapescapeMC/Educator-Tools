import { Difficulty, RawMessage, world } from "@minecraft/server";
import { SceneManager } from "../scene_manager/scene-manager";
import { SceneContext } from "../scene_manager/scene-context";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { WorldSettingsService } from "./world-settings.service";

/**
 * Class representing the World Settings Scene.
 */
export class WorldSettingsScene extends ModalUIScene {
	/**
	 * Creates an instance of WorldSettingsScene.
	 * @param sceneManager - The SceneManager instance.
	 * @param context - The scene context.
	 * @param worldSettingsService - The world settings service.
	 */
	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private worldSettingsService: WorldSettingsService,
	) {
		super("world_settings", context.getSourcePlayer(), "main");

		// Dynamically add toggles for all game rules
		const gameRules = this.worldSettingsService.getGameRules();

		for (const rule of gameRules) {
			this.addToggle(
				rule.translationKey,
				(value: boolean): void => {
					this.worldSettingsService.toggleGameRule(rule.id, value);
				},
				{
					defaultValue: rule.value,
					tooltip: rule.translationKey + "_tooltip",
				},
			);
		}

		const difficulties = Object.keys(Difficulty).filter((key) =>
			isNaN(Number(key)),
		);
		const difficultiesLangKeys: RawMessage[] = difficulties.map(
			(difficulty) => ({
				translate: `edu_tools.ui.world_settings.difficulty.${difficulty.toLowerCase()}`,
			}),
		);

		this.addDropdown(
			"edu_tools.ui.world_settings.select_difficulty",
			difficultiesLangKeys,
			(selectedDifficulty: number): void => {
				const difficulty = difficulties[selectedDifficulty];
				this.worldSettingsService.setDifficulty(
					Difficulty[difficulty as keyof typeof Difficulty],
				);
			},
			{
				defaultValueIndex: difficulties.indexOf(
					Difficulty[world.getDifficulty() as keyof typeof Difficulty],
				), // Set the current difficulty as selected
				tooltip: "edu_tools.ui.world_settings.select_difficulty_tooltip",
			},
		);

		this.show(context.getSourcePlayer(), sceneManager).then((r) => {
			if (!r.canceled) {
				sceneManager.goBackToScene(context, "world_management");
			}
		});
	}
}
