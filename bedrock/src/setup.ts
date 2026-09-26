import { ItemCustomComponent, ItemStack, Player, system, world } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { spawnMarkersIn } from "./spawns.ts";
import { announceChapter, currentChapter, currentChapterKey, give } from "./story.ts";
import { CHAPTERS } from "./storyline.ts";

const BUILT_KEY = "frozen:arendelle_built";
const KIT_KEY = "frozen:kit_given";
/** Worlds younger than this (5 minutes) on first join get Arendelle built around spawn automatically. */
const NEW_WORLD_TICKS = 20 * 60 * 5;
const BUILD_RETRIES = 5;
const ARENDELLE = { name: "frozen:arendelle", size: { x: 33, y: 19, z: 33 }, foundation: 3, playerX: 19, playerZ: 16 };
const KIT: [string, number][] = [
	["frozen:storybook", 1],
	["frozen:elsa_glove", 1],
	["frozen:snowflake_crystal", 3],
	["minecraft:carrot", 8],
	["frozen:olaf_spawn_egg", 1],
];

/** Builds Arendelle with the player on the plaza, and makes it the world spawn. */
export function buildArendelle(player: Player): boolean {
	const dimension = player.dimension;
	if (dimension.id !== "minecraft:overworld") return false;
	const cx = Math.floor(player.location.x);
	const cz = Math.floor(player.location.z);
	try {
		const top = dimension.getTopmostBlock({ x: cx, z: cz });
		if (!top) return false;
		const floorY = top.location.y + 1;
		const origin = { x: cx - ARENDELLE.playerX, y: floorY - ARENDELLE.foundation, z: cz - ARENDELLE.playerZ };
		world.structureManager.place(ARENDELLE.name, dimension, origin);
		world.setDynamicProperty(BUILT_KEY, true);
		const spawn = { x: cx, y: floorY + 1, z: cz };
		player.teleport({ x: cx + 0.5, y: spawn.y, z: cz + 0.5 });
		world.setDefaultSpawnLocation(spawn);
		system.runTimeout(() => spawnMarkersIn(dimension, origin, ARENDELLE.size), 2);
		return true;
	} catch (error) {
		console.warn(`[frozen] Arendelle not built yet: ${error}`);
		return false;
	}
}

function tryBuildArendelle(player: Player, attemptsLeft: number): void {
	system.runTimeout(() => {
		if (!player.isValid || world.getDynamicProperty(BUILT_KEY)) return;
		if (buildArendelle(player)) {
			announceChapter(player);
		} else if (attemptsLeft > 1) {
			tryBuildArendelle(player, attemptsLeft - 1);
		}
	}, 60);
}

function giveKit(player: Player): void {
	if (player.getDynamicProperty(KIT_KEY)) return;
	for (const [id, amount] of KIT) give(player, new ItemStack(id, amount));
	player.setDynamicProperty(KIT_KEY, true);
	player.sendMessage({ translate: "frozen.kit.welcome" });
}

function onJoin(player: Player): void {
	giveKit(player);
	const freshWorld = world.getAbsoluteTime() < NEW_WORLD_TICKS;
	if (!world.getDynamicProperty(BUILT_KEY) && freshWorld) {
		tryBuildArendelle(player, BUILD_RETRIES);
	} else {
		system.runTimeout(() => player.isValid && announceChapter(player), 100);
	}
}

async function showStorybook(player: Player): Promise<void> {
	const chapter = currentChapter();
	const id = currentChapterKey();
	const canBuild = !world.getDynamicProperty(BUILT_KEY);
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
	if (confirm.selection === 1 && buildArendelle(player)) announceChapter(player);
}

export const storybookComponent: ItemCustomComponent = {
	onUse: ({ source }) => void showStorybook(source),
};

export function registerSetup(): void {
	world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
		if (initialSpawn) onJoin(player);
	});
}
