// filters_data/modular_mc/educator_tools/logic/main.ts
import { world } from "@minecraft/server";
var EducatorTools = class {
  constructor() {
  }
};
world.afterEvents.worldLoad.subscribe(() => {
  new EducatorTools();
});
