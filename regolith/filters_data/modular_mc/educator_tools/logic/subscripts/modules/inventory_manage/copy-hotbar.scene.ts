import { Player, world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { InventoryManageService } from "./inventory-manage.service";
import { InventoryManageScene } from "./inventory-manage.scene";

export class CopyHotbarScene extends ActionUIScene {
	static readonly id = "copy_hotbar";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private inventoryManageService: InventoryManageService,
	) {
		super(CopyHotbarScene.id, context.getSourcePlayer());
		const sourcePlayer = world.getEntity(
			context.getSubjectTeam()!.memberIds[0],
		) as Player;

		this.inventoryManageService.copyHotbarToTeam(
			sourcePlayer,
			context.getTargetTeam()!,
		);

		// Dynamically add toggles for all game rules
		this.setRawBody([
			{
				translate: "edu_tools.ui.inventory_manage.copy_hotbar.body.1",
			},
			{ text: " §9" },
			{ text: context.getSubjectTeam()!.name },
			{ text: " §r" },
			{ translate: "edu_tools.ui.inventory_manage.copy_hotbar.body.2" },
			{ text: " §9" },
			{ text: context.getTargetTeam()!.name },
			{ text: " §r" },
			{ translate: "edu_tools.ui.inventory_manage.copy_hotbar.body.3" },
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
