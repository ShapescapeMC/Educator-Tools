import {
	MessageFormData,
	ActionFormData,
	ModalFormData,
	ModalFormResponse,
	MessageFormResponse,
	ActionFormResponse,
	ModalFormDataTextFieldOptions,
	ModalFormDataDropdownOptions,
	ModalFormDataSliderOptions,
	ModalFormDataToggleOptions,
} from "@minecraft/server-ui";
import {
	Player,
	RawMessage,
	RawMessageScore,
	RawText,
} from "@minecraft/server";
import { SceneManager } from "./scene-manager";
import { SceneContext } from "./scene-context";
import { ConfirmSceneConfig } from "../confirm/confirm.scene";

/**
 * Interface representing a RawTextElement.
 * @param translate - Provides a translation token where, if the client has an available resource in the players' language which matches the token, will get translated on the client.
 * @param text - Provides a string literal value to use.
 * @param rawText - Provides a raw-text equivalent of the current message.
 * @param score - Provides a token that will get replaced with the value of a score.
 * @param with - Arguments for the translation token. Can be either an array of strings or RawMessage containing an array of raw text objects.
 */
export interface RawBodyElement {
	translate?: string;
	text?: string;
	rawtext?: RawBodyElement[];
	score?: RawMessageScore;
	with?: string[] | RawMessage;
}

/**
 * Class representing an Action UI Scene.
 */
export class ActionUIScene {
	protected form: ActionFormData;
	protected buttonHandlers: ((response: ActionFormResponse) => void)[];
	protected player: Player;
	protected next_scene_default?: string;
	protected next_scene_config?: ConfirmSceneConfig;
	protected context: SceneContext;

	/**
	 * Creates an instance of ActionUIScene.
	 * @param id - The title of the UI window.
	 * @param player - The player that this UI window is shown to.
	 */
	constructor(id: string, player: Player) {
		this.form = new ActionFormData();
		this.form.title(`edu_tools.ui.${id}.title`);
		this.buttonHandlers = [];
		this.player = player;
	}

	/**
	 * Sets the simple body text of the UI window.
	 * @param body - The text of the body.
	 */
	setSimpleBody(body: string): void {
		this.form.body(body);
	}

	/**
	 * Uses a RawTextElement to set the body text of the UI window.
	 * @param rawtext - A list of RawTextElements that are joined together.
	 */
	setRawBody(rawtext: RawBodyElement[]): void {
		this.form.body({ rawtext: rawtext });
	}

	/**
	 * Adds a button to the UI.
	 * @param text - The text that is displayed on the button.
	 * @param handler - Defines the actions when the button is pressed.
	 * @param iconPath - The path to the item texture.
	 */
	addButton(
		text: string,
		handler: (response: ModalFormResponse) => void,
		iconPath?: string,
	): void {
		if (iconPath === undefined) {
			this.form.button(text);
		} else {
			this.form.button(text, iconPath);
		}
		this.buttonHandlers.push(handler);
	}

	/**
	 * Adds a label to the UI.
	 * @param label - The label text to be displayed.
	 */
	addLabel(label: string | RawMessage): void {
		this.form.label(label);
		//this.buttonHandlers.push(() => {});
	}

	/**
	 * Adds a button with a custom icon to the UI.
	 * @param text - The text that is displayed on the button.
	 * @param handler - Defines the actions when the button is pressed.
	 * @param iconPath - The path to the item texture.
	 */
	addDivider(): void {
		this.form.divider();
		//this.buttonHandlers.push(() => {});
	}

	/**
	 * Sets the next scene to open.
	 * @param scene_name - The name of the next scene.
	 * @param config - Optional configuration for the next scene.
	 */
	setNextScene(scene_name: string, config?: ConfirmSceneConfig): void {
		this.next_scene_default = scene_name;
		this.next_scene_config = config;
	}

	/**
	 * Sets the context for this scene.
	 * @param context - The scene context.
	 */
	setContext(context: SceneContext): void {
		this.context = context;
	}

	/**
	 * Shows the UI to a player.
	 * @param player - The Player object the UI is shown to.
	 * @param sceneManager - Optional SceneManager instance for scene navigation.
	 */
	async show(
		player: Player,
		sceneManager?: SceneManager,
	): Promise<ActionFormResponse> {
		return this.form.show(player).then((r) => {
			if (!r.canceled && r.selection !== undefined) {
				this.buttonHandlers[r.selection](r);

				if (sceneManager && this.next_scene_default && this.context) {
					sceneManager.openSceneWithContext(
						this.context,
						this.next_scene_default,
						this.next_scene_config,
					);
				}
			}
			return r;
		});
	}
}

/**
 * Class representing a Message UI Scene.
 */
export class MessageUIScene {
	protected form: MessageFormData;
	protected body: string;
	protected buttonHandlers: ((response: MessageFormResponse) => void)[];
	protected player: Player;
	protected next_scene_default?: string;
	protected next_scene_config?: ConfirmSceneConfig;
	protected context?: SceneContext;

	/**
	 * Creates an instance of MessageUIScene.
	 * @param id - The id of the UI window.
	 * @param player - The player that this UI window is shown to.
	 */
	constructor(id: string, player: Player) {
		this.form = new MessageFormData();
		this.form.title(`edu_tools.ui.${id}.title`);
		this.buttonHandlers = [];
		this.player = player;
	}

	/**
	 * Sets the text and handler for button 1.
	 * @param text - The text that is displayed on the button.
	 * @param handler - Defines the actions when the button is pressed.
	 */
	setButton1(
		text: string,
		handler: (response: ModalFormResponse) => void,
	): void {
		this.form.button1(text);
		this.buttonHandlers.push(handler);
	}

	/**
	 * Sets the text and handler for button 2.
	 * @param text - The text that is displayed on the button.
	 * @param handler - Defines the actions when the button is pressed.
	 */
	setButton2(
		text: string,
		handler: (response: ModalFormResponse) => void,
	): void {
		this.form.button2(text);
		this.buttonHandlers.push(handler);
	}

	/**
	 * Sets the simple body text of the UI window.
	 * @param body - The text of the body.
	 */
	setSimpleBody(body: string): void {
		this.form.body(body);
	}

	/**
	 * Uses a RawTextElement to set the body text of the UI window.
	 * @param rawtext - A list of RawTextElements that are joined together.
	 */
	setRawBody(rawtext: RawBodyElement[]): void {
		this.form.body({ rawtext: rawtext });
	}

	/**
	 * Sets the next scene to open.
	 * @param scene_name - The name of the next scene.
	 * @param config - Optional configuration for the next scene.
	 */
	setNextScene(scene_name: string, config?: ConfirmSceneConfig): void {
		this.next_scene_default = scene_name;
		this.next_scene_config = config;
	}

	/**
	 * Sets the context for this scene.
	 * @param context - The scene context.
	 */
	setContext(context: SceneContext): void {
		this.context = context;
	}

	/**
	 * Shows the UI to a player.
	 * @param player - The Player object the UI is shown to.
	 * @param sceneManager - Optional SceneManager instance for scene navigation.
	 */
	async show(
		player: Player,
		sceneManager?: SceneManager,
	): Promise<MessageFormResponse> {
		return this.form.show(player).then((r) => {
			if (!r.canceled && r.selection !== undefined) {
				this.buttonHandlers[r.selection](r);

				if (sceneManager && this.next_scene_default && this.context) {
					sceneManager.openSceneWithContext(
						this.context,
						this.next_scene_default,
						this.next_scene_config,
					);
				}
			}
			return r;
		});
	}
}

/**
 * Class representing a Modal UI Scene.
 */
export class ModalUIScene {
	protected form: ModalFormData;
	protected body: string;
	protected buttonHandlers: ((value: any) => void)[];
	protected player: Player;
	protected next_scene_default?: string;
	protected next_scene_config?: ConfirmSceneConfig;
	protected context?: SceneContext;

	/**
	 * Creates an instance of ModalUIScene.
	 * @param id - The id of the UI window.
	 * @param player - The player that this UI window is shown to.
	 * @param next_scene_default - The default next scene to open.
	 */
	constructor(
		id: string,
		player: Player,
		next_scene_default?: string,
		next_scene_config?: ConfirmSceneConfig,
	) {
		this.form = new ModalFormData();
		// This must not be a rawtext, as apparently the title is not translated in the json ui.
		this.form.title(`edu_tools.ui.${id}.title`);
		this.buttonHandlers = [];
		this.player = player;
		this.next_scene_default = next_scene_default;
		this.next_scene_config = next_scene_config;
	}

	/**
	 * Adds a button with a custom icon to the UI.
	 * @param text - The text that is displayed on the button.
	 * @param handler - Defines the actions when the button is pressed.
	 * @param iconPath - The path to the item texture.
	 */
	addDivider(): void {
		this.form.divider();
		this.buttonHandlers.push(() => {});
	}

	/**
	 * Adds a text field to the UI.
	 * @param label - The label of the text field.
	 * @param text - The text of the text field.
	 * @param handler - Defines the actions when the text field value changes.
	 * @param defaultValue - The default value of the text field.
	 */
	addTextField(
		label: RawMessage | string,
		placeholderText: RawMessage | string,
		handler: (value: string) => void,
		textFieldOptions?: ModalFormDataTextFieldOptions,
	): void {
		this.form.textField(label, placeholderText, textFieldOptions);
		this.buttonHandlers.push(handler);
	}

	/**
	 * Adds a dropdown to the UI.
	 * @param label - The label of the dropdown.
	 * @param options - The options of the dropdown.
	 * @param handler - Defines the actions when the dropdown value changes.
	 * @param defaultIndex - The default selected index of the dropdown.
	 */
	addDropdown(
		label: RawMessage | string,
		items: (RawMessage | string)[],
		handler: (value: any) => void,
		dropdownOptions?: ModalFormDataDropdownOptions,
	): void {
		this.form.dropdown(label, items, dropdownOptions);
		this.buttonHandlers.push(handler);
	}

	/**
	 * Adds a slider to the UI.
	 * @param label - The label of the slider.
	 * @param min - The minimum value of the slider.
	 * @param max - The maximum value of the slider.
	 * @param handler - Defines the actions when the slider value changes.
	 * @param defaultValue - The default value of the slider.
	 */
	addSlider(
		label: RawMessage | string,
		minimumValue: number,
		maximumValue: number,
		handler: (value: number) => void,
		sliderOptions?: ModalFormDataSliderOptions,
	): void {
		this.form.slider(label, minimumValue, maximumValue, sliderOptions);
		this.buttonHandlers.push(handler);
	}

	/**
	 * Adds a toggle to the UI.
	 * @param label - The label of the toggle.
	 * @param handler - Defines the actions when the toggle value changes.
	 * @param defaultValue - The default value of the toggle.
	 */
	addToggle(
		label: RawMessage | string,
		handler: (value: boolean) => void,
		toggleOptions?: ModalFormDataToggleOptions,
	): void {
		this.form.toggle(label, toggleOptions);
		this.buttonHandlers.push(handler);
	}

	/**
	 * Sets the title of the UI window.
	 * @param id - The ID for the translation key that will be used as title.
	 */
	setTitle(id: string): void {
		this.form.title(`edu_tools.ui.${id}.title`);
	}

	addLabel(label: string | RawMessage): void {
		this.form.label(label);
		this.buttonHandlers.push(() => {});
	}

	/**
	 * Sets the next scene to open.
	 * @param scene_name - The name of the next scene.
	 */
	setNextScene(scene_name?: string): void {
		this.next_scene_default = scene_name;
	}

	/**
	 * Sets the context for this scene.
	 * @param context - The scene context.
	 */
	setContext(context: SceneContext): void {
		this.context = context;
	}

	/**
	 * Shows the UI to a player.
	 * @param player - The Player object the UI is shown to.
	 * @param sceneManager - The SceneManager instance.
	 */
	async show(
		player: Player,
		sceneManager: SceneManager,
	): Promise<ModalFormResponse> {
		return this.form.show(player).then((r) => {
			if (r.canceled) {
				return r;
			}
			if (r.formValues != undefined) {
				for (let i = 0; i < this.buttonHandlers.length; i++) {
					this.buttonHandlers[i](r.formValues[i]);
				}
			}
			if (this.next_scene_default && this.context) {
				sceneManager.openSceneWithContext(
					this.context,
					this.next_scene_default,
					this.next_scene_config,
				);
			}
			return r;
		});
	}
}
