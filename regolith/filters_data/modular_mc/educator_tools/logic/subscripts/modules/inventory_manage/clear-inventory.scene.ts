import { Player, world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { InventoryManageService } from "./inventory-manage.service";
import { InventoryManageScene } from "./inventory-manage.scene";

export class ClearInventoryScene extends ActionUIScene {
	static readonly id = "clear_inventory";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private inventoryManageService: InventoryManageService,
	) {
		super(ClearInventoryScene.id, context.getSourcePlayer());

		this.inventoryManageService.clearInventoryOfTeam(context.getSubjectTeam()!);

		// Dynamically add toggles for all game rules
		this.setRawBody([
			{
				translate: "edu_tools.ui.inventory_manage.clear_inventory.body.1",
			},
			{ text: " §9" },
			{ text: context.getSubjectTeam()!.name },
			{ text: " §r" },
			{ translate: "edu_tools.ui.inventory_manage.clear_inventory.body.2" },
		]);
		this.addButton(
			"edu_tools.ui.buttons.back",
			() => {
				sceneManager.goBackToScene(context, InventoryManageScene.id);
			},
			"textures/edu_tools/ui/icons/_general/back",
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
