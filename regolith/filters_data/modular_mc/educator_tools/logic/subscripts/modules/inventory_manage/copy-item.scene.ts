import { Player, world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ModalUIScene } from "../scene_manager/ui-scene";
import { InventoryManageService } from "./inventory-manage.service";
import { InventoryManageScene } from "./inventory-manage.scene";

export class CopyItemScene extends ModalUIScene {
	static readonly id = "copy_item";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private inventoryManageService: InventoryManageService,
	) {
		super(CopyItemScene.id, context.getSourcePlayer(), "confirm");
		const sourcePlayer = world.getEntity(
			context.getSubjectTeam()!.memberIds[0],
		) as Player;

		this.addLabel({
			rawtext: [
				{
					translate: "edu_tools.ui.inventory_manage.copy_item.body.1",
				},
				{ text: " §9" },
				{ text: context.getSubjectTeam()!.name },
				{ text: " §r" },
				{ translate: "edu_tools.ui.inventory_manage.copy_item.body.2" },
				{ text: " §9" },
				{ text: context.getTargetTeam()!.name },
				{ text: " §r" },
				{ translate: "edu_tools.ui.inventory_manage.copy_item.body.3" },
			],
		});

		const items = this.inventoryManageService.getItemsInInventory(sourcePlayer);
		const itemStacks = items.map((itemData) => itemData.itemName);

		this.addDropdown(
			"edu_tools.ui.copy_item.select_item",
			itemStacks,
			(selectedItem: number): void => {
				this.inventoryManageService.copyItemToTeam(
					sourcePlayer,
					context.getTargetTeam()!,
					items[selectedItem].index,
				);
			},
			{
				tooltip: "edu_tools.ui.copy_item.select_item_tooltip",
			},
		);

		this.show(context.getSourcePlayer(), sceneManager).then((r) => {
			if (!r.canceled) {
				sceneManager.goBackToScene(context, InventoryManageScene.id);
			}
		});
	}
}
