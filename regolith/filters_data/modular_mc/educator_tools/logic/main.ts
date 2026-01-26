import { world } from "@minecraft/server";
import { ModuleManager } from "./subscripts/module-manager";

class EducatorTools {
	constructor() {
		// Initialize the singleton ModuleManager
		ModuleManager.getInstance();
	}
}
world.afterEvents.worldLoad.subscribe(() => {
	// Initialize the Educator Tools
	new EducatorTools();
});
