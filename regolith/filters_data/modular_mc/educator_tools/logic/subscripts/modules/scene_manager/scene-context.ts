import { Player } from "@minecraft/server";
import { Team } from "../teams/interfaces/team.interface";

/**
 * Class representing the context for a scene.
 * This maintains state across scene navigation, including history,
 * subject/target team selections, and arbitrary data.
 */
export class SceneContext {
	private sceneHistory: string[] = [];
	private nextScene: string | null = null;
	private nextSceneArgs: any[] = [];
	private sourcePlayer: Player;
	private subjectTeam: Team | null = null;
	private targetTeam: Team | null = null;
	private contextData: Map<string, any> = new Map();

	/**
	 * Creates a new SceneContext.
	 * @param sourcePlayer - The player who has the UI open.
	 */
	constructor(sourcePlayer: Player) {
		this.sourcePlayer = sourcePlayer;
	}

	/**
	 * Adds a scene to the history.
	 * @param sceneName - The name of the scene to add.
	 */
	public addToHistory(sceneName: string): void {
		this.sceneHistory.push(sceneName);
	}

	/**
	 * Gets the current scene history.
	 * @returns The array of scene names in the history.
	 */
	public getHistory(): string[] {
		return [...this.sceneHistory];
	}

	/**
	 * Sets the scene history to a specific array.
	 * @param history - The array of scene names to set as history.
	 */
	public setHistory(history: string[]): void {
		this.sceneHistory = [...history];
	}

	/**
	 * Gets the previous scene from the history.
	 * @returns The name of the previous scene or null if there isn't one.
	 */
	public getPreviousScene(): string | null {
		if (this.sceneHistory.length > 1) {
			return this.sceneHistory[this.sceneHistory.length - 2];
		}
		return null;
	}

	/**
	 * Clears the scene history.
	 */
	public clearHistory(): void {
		this.sceneHistory = [];
	}

	/**
	 * Sets the next scene to navigate to after the current scene completes.
	 * @param sceneName - The name of the scene to navigate to.
	 * @param args - Arguments to pass to the next scene.
	 */
	public setNextScene(sceneName: string, ...args: any[]): void {
		this.nextScene = sceneName;
		this.nextSceneArgs = args;
	}

	/**
	 * Gets information about the next scene.
	 * @returns A tuple containing the next scene name and arguments.
	 */
	public getNextScene(): [string | null, any[]] {
		return [this.nextScene, [...this.nextSceneArgs]];
	}

	/**
	 * Clears the next scene information.
	 */
	public clearNextScene(): void {
		this.nextScene = null;
		this.nextSceneArgs = [];
	}

	/**
	 * Gets the source player.
	 * @returns The player who has the UI open.
	 */
	public getSourcePlayer(): Player {
		return this.sourcePlayer;
	}

	/**
	 * Sets the subject team for the current operation.
	 * @param team - The team to set as subject.
	 */
	public setSubjectTeam(team: Team | null): void {
		this.subjectTeam = team;
	}

	/**
	 * Gets the subject team.
	 * @returns The current subject team or null if not set.
	 */
	public getSubjectTeam(): Team | null {
		return this.subjectTeam;
	}

	/**
	 * Sets the target team for the current operation.
	 * @param team - The team to set as target.
	 */
	public setTargetTeam(team: Team | null): void {
		this.targetTeam = team;
	}

	/**
	 * Gets the target team.
	 * @returns The current target team or null if not set.
	 */
	public getTargetTeam(): Team | null {
		return this.targetTeam;
	}

	public isSubjectTeamRequired(): boolean {
		return this.getData("get_subject") === true;
	}

	public isTargetTeamRequired(): boolean {
		return this.getData("get_target") === true;
	}

	public setSubjectTeamRequired(required: boolean): void {
		this.setData("get_subject", required);
	}

	public setTargetTeamRequired(required: boolean): void {
		this.setData("get_target", required);
	}

	/**
	 * Stores data in the context.
	 * @param key - The key to store the data under.
	 * @param value - The value to store.
	 */
	public setData(key: string, value: any): void {
		this.contextData.set(key, value);
	}

	/**
	 * Retrieves data from the context.
	 * @param key - The key to retrieve data for.
	 * @returns The stored value or undefined if not found.
	 */
	public getData(key: string): any {
		return this.contextData.get(key);
	}

	/**
	 * Checks if data exists in the context.
	 * @param key - The key to check.
	 * @returns True if the key exists, false otherwise.
	 */
	public hasData(key: string): boolean {
		return this.contextData.has(key);
	}

	/**
	 * Clears all stored data.
	 */
	public clearData(): void {
		this.contextData.clear();
	}

	/**
	 * Resets the context to its initial state.
	 */
	public reset(): void {
		this.clearHistory();
		this.clearNextScene();
		this.subjectTeam = null;
		this.targetTeam = null;
		this.clearData();
	}
}
