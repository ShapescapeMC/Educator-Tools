import { world } from "@minecraft/server";
import { SceneContext } from "../scene_manager/scene-context.ts";
import { SceneManager } from "../scene_manager/scene-manager.ts";
import { ActionUIScene } from "../scene_manager/ui-scene.ts";
import { Assignment, AssignmentService } from "./assignment.service.ts";

export class AssignmentDeleteScene extends ActionUIScene {
  static readonly id = "assignment_delete";

  constructor(
    sceneManager: SceneManager,
    context: SceneContext,
    assignmentService: AssignmentService,
  ) {
    super(AssignmentDeleteScene.id, context.getSourcePlayer());
    const assignmentID = context.getData("assignment");
    const assignment = assignmentService.getAssignment(
      assignmentID!,
    ) as Assignment;
    this.setRawBody([
      { translate: "edu_tools.ui.assignment.delete.body.1" },
      { text: " §9" },
      { text: assignment.title },
      { text: " §r" },
      { translate: "edu_tools.ui.assignment.delete.body.2" },
    ]);

    this.addDivider();

    this.addButton(
      "edu_tools.ui.assignment.delete.buttons.delete",
      (): void => {
        //assignmentService.deleteAssignment(assignment.id);
        const target = this.getBackTargetFromHistory(context);
        if (target) {
          sceneManager.goBackToScene(context, target);
        } else {
          sceneManager.goBackToScene(context, "assignment_teacher");
        }
      },
      "textures/edu_tools/ui/assignment/assignment_delete",
    );
    this.addButton(
      "edu_tools.ui.assignment.delete.buttons.cancel",
      () => {
        sceneManager.goBackToScene(context, "assignment_manage");
      },
      "textures/edu_tools/ui/_general/back",
    );
    this.show(context.getSourcePlayer(), sceneManager);
  }

  private getBackTargetFromHistory(context: SceneContext): string | undefined {
    const history = context.getHistory();
    const idxActive = history.lastIndexOf("active_assignments");
    const idxCompleted = history.lastIndexOf("completed_assignments");

    if (idxActive === -1 && idxCompleted === -1) return undefined;
    if (idxActive === -1) return "completed_assignments";
    if (idxCompleted === -1) return "active_assignments";
    return idxActive > idxCompleted
      ? "active_assignments"
      : "completed_assignments";
  }
}
