import { Player, world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context";
import { SceneManager } from "../scene_manager/scene-manager";
import { ActionUIScene } from "../scene_manager/ui-scene";
import { InventoryManageService } from "./inventory-manage.service";

export class InventoryManageScene extends ActionUIScene {
	static readonly id = "inventory_manage";

	constructor(
		sceneManager: SceneManager,
		context: SceneContext,
		private inventoryManageService: InventoryManageService,
	) {
		super(InventoryManageScene.id, context.getSourcePlayer());
		const sourcePlayer = world.getEntity(
			context.getSubjectTeam()!.memberIds[0],
		) as Player;

		// Dynamically add toggles for all game rules
		this.setRawBody([
			{
				translate: "edu_tools.ui.inventory_manage.body.1",
			},
			{
				text: " §9",
			},
			{
				text: context.getSubjectTeam()!.name,
			},
			{
				text: " §r",
			},
			{
				translate: "edu_tools.ui.inventory_manage.body.body.2",
			},
			{
				text: " §9",
			},
			{
				text: context.getTargetTeam()!.name,
			},
		]);

		this.addButton(
			"edu_tools.ui.inventory_manage.buttons.copy_inventory",
			(): void => {
				this.inventoryManageService.inventoryManageToTeam(
					sourcePlayer,
					context.getTargetTeam()!,
				);
			},
			"textures/edu_tools/ui/icons/inventory_manage/copy_inventory",
		);

		this.addButton(
			"edu_tools.ui.inventory_manage.buttons.copy_hotbar",
			(): void => {
				this.inventoryManageService.copyHotbarToTeam(
					sourcePlayer,
					context.getTargetTeam()!,
				);
			},
			"textures/edu_tools/ui/icons/inventory_manage/copy_hotbar",
		);

		this.addButton(
			"edu_tools.ui.inventory_manage.buttons.copy_item",
			(): void => {
				sceneManager.openSceneWithContext(context, "copy_item", false);
			},
			"textures/edu_tools/ui/icons/inventory_manage/copy_item",
		);

		this.addButton(
			"edu_tools.ui.inventory_manage.buttons.clear_inventory",
			(): void => {
				this.inventoryManageService.clearInventoryOfTeam(
					context.getTargetTeam()!,
				);
			},
			"textures/edu_tools/ui/icons/inventory_manage/clear_inventory",
		);

		this.show(context.getSourcePlayer(), sceneManager);
	}
}
