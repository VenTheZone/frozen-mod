import { EntityTypes, ItemCustomComponent, Player, system, world } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { placeStructure, spawnMarkersIn } from "./spawns.ts";
import { announceChapter, currentChapter, currentChapterKey, give } from "./story.ts";
import { CHAPTERS } from "./storyline.ts";

const VERSION = "1.2.4";
/** Entity type defined only by the Frozen World's own pack; that world builds its own town and kit. */
const WORLD_FLAG = "frozen_world:flag";

export function isFrozenWorld(): boolean {
	return EntityTypes.get(WORLD_FLAG) !== undefined || world.scoreboard.getObjective("frozen_world") !== undefined;
}
const BUILT_KEY = "frozen:arendelle_built";
const KIT_KEY = "frozen:kit_given";
/** Worlds younger than this (20 minutes) get Arendelle built around the first player automatically. */
const NEW_WORLD_TICKS = 20 * 60 * 20;
/** Phones can take a while to generate spawn chunks: retry every 3 s for about 2 minutes. */
const BUILD_RETRIES = 40;
const RETRY_TICKS = 60;
const ARENDELLE = { name: "frozen:arendelle", size: { x: 33, y: 19, z: 33 }, foundation: 3, playerX: 19, playerZ: 16 };
const KIT: [string, number][] = [
	["frozen:storybook", 1],
	["frozen:elsa_glove", 1],
	["frozen:snowflake_crystal", 3],
	["minecraft:carrot", 8],
	["frozen:olaf_spawn_egg", 1],
];

/** Builds Arendelle with the player on the plaza and makes it the world spawn. Throws if it can't be placed yet. */
function placeArendelle(player: Player): void {
	const dimension = player.dimension;
	if (dimension.id !== "minecraft:overworld") throw new Error("Arendelle can only be built in the Overworld");
	const cx = Math.floor(player.location.x);
	const cz = Math.floor(player.location.z);
	const top = dimension.getTopmostBlock({ x: cx, z: cz });
	if (!top) throw new Error("the ground here isn't loaded yet");
	const floorY = top.location.y + 1;
	const origin = { x: cx - ARENDELLE.playerX, y: floorY - ARENDELLE.foundation, z: cz - ARENDELLE.playerZ };
	placeStructure(ARENDELLE.name, dimension, origin);
	world.setDynamicProperty(BUILT_KEY, true);
	system.runTimeout(() => spawnMarkersIn(dimension, origin, ARENDELLE.size), 2);
	try {
		player.teleport({ x: cx + 0.5, y: floorY + 1, z: cz + 0.5 });
		world.setDefaultSpawnLocation({ x: cx, y: floorY + 1, z: cz });
	} catch (error) {
		console.warn(`[frozen] Arendelle built, but moving the player failed: ${error}`);
	}
}

export function buildArendelle(player: Player): string | undefined {
	try {
		placeArendelle(player);
		player.sendMessage({ translate: "frozen.status.built" });
		return undefined;
	} catch (error) {
		return String(error);
	}
}

function tryBuildArendelle(player: Player, attemptsLeft: number): void {
	system.runTimeout(() => {
		if (!player.isValid || world.getDynamicProperty(BUILT_KEY)) return;
		const error = buildArendelle(player);
		if (!error) {
			announceChapter(player);
		} else if (attemptsLeft > 1) {
			tryBuildArendelle(player, attemptsLeft - 1);
		} else {
			player.sendMessage({ translate: "frozen.status.build_failed", with: [error] });
		}
	}, RETRY_TICKS);
}

function giveKit(player: Player): void {
	if (player.getDynamicProperty(KIT_KEY)) return;
	for (const [id, amount] of KIT) {
		try {
			give(player, id, amount);
		} catch (error) {
			console.warn(`[frozen] could not give ${id}: ${error}`);
		}
	}
	player.setDynamicProperty(KIT_KEY, true);
	player.sendMessage({ translate: "frozen.kit.welcome" });
}

function onJoin(player: Player): void {
	player.sendMessage({ translate: "frozen.status.loaded", with: [VERSION] });
	if (isFrozenWorld()) {
		system.runTimeout(() => player.isValid && announceChapter(player), 200);
		return;
	}
	const shouldBuild = !world.getDynamicProperty(BUILT_KEY) && world.getAbsoluteTime() < NEW_WORLD_TICKS;
	if (shouldBuild) {
		player.sendMessage({ translate: "frozen.status.building" });
		tryBuildArendelle(player, BUILD_RETRIES);
	} else {
		system.runTimeout(() => player.isValid && announceChapter(player), 100);
	}
	giveKit(player);
}

async function showStorybook(player: Player): Promise<void> {
	const chapter = currentChapter();
	const id = currentChapterKey();
	const canBuild = !world.getDynamicProperty(BUILT_KEY) && !isFrozenWorld();
	const form = new ActionFormData()
		.title({ translate: "frozen.storybook.title" })
		.body({
			rawtext: [
				{ translate: "frozen.storybook.progress", with: [String(Math.min(chapter + 1, CHAPTERS.length)), String(CHAPTERS.length)] },
				{ text: "\n\n§l" },
				{ translate: `frozen.story.${id}.title` },
				{ text: "§r\n" },
				{ translate: `frozen.story.${id}.goal` },
				{ text: "\n\n§7" },
				{ translate: `frozen.story.${id}.hint` },
			],
		})
		.button({ translate: "frozen.storybook.close" });
	if (canBuild) form.button({ translate: "frozen.storybook.build" });

	const response = await form.show(player);
	if (!canBuild || response.canceled || response.selection !== 1) return;
	const confirm = await new MessageFormData()
		.title({ translate: "frozen.storybook.build" })
		.body({ translate: "frozen.storybook.confirm" })
		.button1({ translate: "frozen.storybook.no" })
		.button2({ translate: "frozen.storybook.yes" })
		.show(player);
	if (confirm.selection !== 1) return;
	const error = buildArendelle(player);
	if (error) {
		player.sendMessage({ translate: "frozen.status.build_failed", with: [error] });
	} else {
		announceChapter(player);
	}
}

export const storybookComponent: ItemCustomComponent = {
	onUse: ({ source }) => void showStorybook(source),
};

export function registerSetup(): void {
	world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
		// Give the world's setup functions a second to create their scoreboard first.
		if (initialSpawn) system.runTimeout(() => player.isValid && onJoin(player), 20);
	});
}
