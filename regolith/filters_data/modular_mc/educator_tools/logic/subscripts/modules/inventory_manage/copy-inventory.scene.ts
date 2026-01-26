import { Player, world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context.ts";
import { SceneManager } from "../scene_manager/scene-manager.ts";
import { ActionUIScene } from "../scene_manager/ui-scene.ts";
import { InventoryManageService } from "./inventory-manage.service.ts";
import { Team } from "../teams/interfaces/team.interface.ts";
import { TeamsService } from "../teams/teams.service.ts";
import { InventoryManageScene } from "./inventory-manage.scene.ts";

export class CopyInventoryScene extends ActionUIScene {
	static readonly id = "copy_inventory";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private inventoryManageService: InventoryManageService,
	) {
		super(CopyInventoryScene.id, context.getSourcePlayer());
		const sourcePlayer = world.getEntity(
			context.getSubjectTeam()!.memberIds[0],
		) as Player;

		this.inventoryManageService.inventoryCopyToTeam(
			sourcePlayer,
			context.getTargetTeam()!,
		);

		// Dynamically add toggles for all game rules
		this.setRawBody([
			{
				translate: "edu_tools.ui.inventory_manage.copy_inventory.body.1",
			},
			{ text: " §9" },
			{ text: context.getSubjectTeam()!.name },
			{ text: " §r" },
			{ translate: "edu_tools.ui.inventory_manage.copy_inventory.body.2" },
			{ text: " §9" },
			{ text: context.getTargetTeam()!.name },
			{ text: " §r" },
			{ translate: "edu_tools.ui.inventory_manage.copy_inventory.body.3" },
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
