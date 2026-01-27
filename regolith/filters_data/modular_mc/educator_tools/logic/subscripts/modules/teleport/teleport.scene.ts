import { Player, world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context.ts";
import { SceneManager } from "../scene_manager/scene-manager.ts";
import { ActionUIScene } from "../scene_manager/ui-scene.ts";
import { TeleportService } from "./teleport.service.ts";

export class TeleportScene extends ActionUIScene {
  static readonly id = "teleport";

  constructor(
    sceneManager: SceneManager,
    context: SceneContext,
    private teleportService: TeleportService,
  ) {
    super(TeleportScene.id, context.getSourcePlayer());
    const targetPlayer = world.getEntity(
      context.getTargetTeam()!.memberIds[0],
    ) as Player;

    // Dynamically add toggles for all game rules
    this.setRawBody([
      {
        translate: "edu_tools.ui.teleport.body.1",
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
        translate: "edu_tools.ui.teleport.body.2",
      },
      {
        text: " §9",
      },
      {
        text: context.getTargetTeam()!.name,
      },
    ]);

    this.addButton("edu_tools.ui.teleport.buttons.teleport", (): void => {
      // Call the teleport service to perform the teleport action
      this.teleportService.teleportTeamToPlayer(
        context.getSubjectTeam()!,
        targetPlayer,
      );
    });

    this.addButton(
      "edu_tools.ui.buttons.back",
      () => {
        sceneManager.goBackToScene(context, "main");
      },
      "textures/edu_tools/ui/_general/back",
    );

    this.show(context.getSourcePlayer(), sceneManager);
  }
}
