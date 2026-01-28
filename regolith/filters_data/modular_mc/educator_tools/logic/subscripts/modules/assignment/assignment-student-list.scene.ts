import { ModuleManager } from "../../module-manager.ts";
import { SceneContext } from "../scene_manager/scene-context.ts";
import { SceneManager } from "../scene_manager/scene-manager.ts";
import { ActionUIScene } from "../scene_manager/ui-scene.ts";
import { TeamsService } from "../teams/teams.service.ts";
import { AssignmentService } from "./assignment.service.ts";

export class AssignmentStudentListScene extends ActionUIScene {
  static readonly id = "assignment_student_list";

  constructor(
    sceneManager: SceneManager,
    context: SceneContext,
    assignmentService: AssignmentService,
  ) {
    super(AssignmentStudentListScene.id, context.getSourcePlayer());

    const teamsService = ModuleManager.getInstance().getModule(
      TeamsService.id,
    ) as TeamsService;
    const playerTeams = teamsService.getPlayerTeams(
      context.getSourcePlayer().id,
    );

    const assignments = assignmentService.getTeamsAssignments(
      playerTeams.map((team) => team.id),
      true,
    );

    if (assignments.length === 0) {
      this.setRawBody([
        { translate: "edu_tools.ui.assignment.no_assignments" },
      ]);
    } else {
      for (const assignment of assignments) {
        this.addButton(
          assignment.title,
          () => {
            context.setData("assignment", assignment.id);
            sceneManager.openSceneWithContext(
              context,
              "assignment_student_detail",
              true,
            );
          },
          "textures/edu_tools/ui/generic/" + assignment.icon,
        );
      }
    }

    this.show(context.getSourcePlayer(), sceneManager);
  }
}
