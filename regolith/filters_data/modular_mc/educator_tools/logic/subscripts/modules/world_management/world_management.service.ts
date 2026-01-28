import { Module } from "../../module-manager.ts";
import { SceneContext } from "../scene_manager/scene-context.ts";
import { SceneManager } from "../scene_manager/scene-manager.ts";
import { WorldManagementScene } from "./world_management.scene.ts";

export class WorldManagementService implements Module {
  readonly id: string = "world_management";

  constructor() {}

  registerScenes(sceneManager: any): void {
    sceneManager.registerScene(
      "world_management",
      (manager: SceneManager, context: SceneContext) => {
        new WorldManagementScene(manager, context);
      },
    );
  }

  getMainButton(): any {
    return {
      labelKey: "edu_tools.ui.main.buttons.world_management",
      iconPath: "textures/edu_tools/ui/main/world_management",
      handler: (sceneManager: any, context: any) => {
        sceneManager.openSceneWithContext(context, "world_management", true);
      },
      weight: 200,
    };
  }
}
