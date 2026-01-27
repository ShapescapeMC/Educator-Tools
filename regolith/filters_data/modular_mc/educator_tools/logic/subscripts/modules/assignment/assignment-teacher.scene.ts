import { SceneContext } from "../scene_manager/scene-context.ts";
import { SceneManager } from "../scene_manager/scene-manager.ts";
import { ActionUIScene } from "../scene_manager/ui-scene.ts";

export class AssignmentTeacherScene extends ActionUIScene {
  static readonly id = "assignment_teacher";

  constructor(sceneManager: SceneManager, context: SceneContext) {
    super(AssignmentTeacherScene.id, context.getSourcePlayer());
    this.setRawBody([{ translate: "edu_tools.ui.assignment.teacher.body" }]);

    this.addButton(
      "edu_tools.ui.assignment.teacher.buttons.create_assignment",
      (): void => {
        sceneManager.openSceneWithContext(context, "assignment_create", true);
      },
      "textures/edu_tools/ui/assignment/create_assignment",
    );
    this.addButton(
      "edu_tools.ui.assignment.teacher.buttons.active_assignments",
      (): void => {
        sceneManager.openSceneWithContext(context, "active_assignments", true);
      },
      "textures/edu_tools/ui/assignment/active_assignments",
    );
    this.addButton(
      "edu_tools.ui.assignment.teacher.buttons.completed_assignments",
      (): void => {
        sceneManager.openSceneWithContext(
          context,
          "completed_assignments",
          true,
        );
      },
      "textures/edu_tools/ui/assignment/completed_assignments",
    );
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
