import { world } from "@minecraft/server";

export function playSoundToAllPlayers(
	sound: string,
	volume?: number,
	pitch?: number,
): void {
	world.getPlayers().forEach((player) => {
		player.playSound(sound, { volume: volume ?? 1, pitch: pitch ?? 1 });
	});
}
