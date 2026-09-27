import { Entity, system, world } from "@minecraft/server";
import { duplicatesToRemove } from "./logic.ts";

/** Named characters: only one of each may stand in one place. Groups (guards, trolls, townsfolk) are exempt. */
const CHARACTERS = ["elsa", "anna", "kristoff", "olaf", "sven", "marshmallow", "hans", "duke", "oaken", "kai", "gerda", "pabbie"].map((n) => `frozen:${n}`);
const RADIUS = 48;
const INTERVAL_TICKS = 100;

const isProtected = (e: Entity) => e.nameTag !== "" || e.getComponent("minecraft:is_tamed") !== undefined;

/** Removes stacked copies of the same character, so a spawning mistake can never flood a world. */
function removeDuplicates(): void {
	const overworld = world.getDimension("overworld");
	for (const type of CHARACTERS) {
		const found = overworld.getEntities({ type });
		const placed = found.map((e) => ({ ...e.location, keep: isProtected(e) }));
		for (const i of duplicatesToRemove(placed, RADIUS)) {
			found[i].remove();
		}
	}
}

export function registerCleanup(): void {
	system.runInterval(removeDuplicates, INTERVAL_TICKS);
}
