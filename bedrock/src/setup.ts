import { EntityTypes, GameMode, ItemCustomComponent, Player, system, world } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { placeStructure, spawnMarkersIn } from "./spawns.ts";
import { giveStarterKit } from "./kit.ts";
import { announceChapter, currentChapter, currentChapterKey, storyState, storyText } from "./story.ts";
import { CHAPTERS } from "./storyline.ts";

/** Entity type defined only by the Frozen World's own pack; that world builds its own town and kit. */
const WORLD_FLAG = "frozen_world:flag";

export function isFrozenWorld(): boolean {
	return EntityTypes.get(WORLD_FLAG) !== undefined || world.scoreboard.getObjective("frozen_world") !== undefined;
}
const BUILT_KEY = "frozen:arendelle_built";
/** Worlds younger than this (20 minutes) get Arendelle built around the first player automatically. */
const NEW_WORLD_TICKS = 20 * 60 * 20;
/** Phones can take a while to generate spawn chunks: retry every 3 s for about 2 minutes. */
const BUILD_RETRIES = 40;
const RETRY_TICKS = 60;
const ARENDELLE = { name: "frozen:arendelle", size: { x: 33, y: 19, z: 33 }, foundation: 3, playerX: 19, playerZ: 16 };
/** Storybook buttons that switch the player's own game mode; works without cheats. */
const GAME_MODES: [string, GameMode][] = [
	["frozen.storybook.survival", GameMode.Survival],
	["frozen.storybook.creative", GameMode.Creative],
	["frozen.storybook.adventure", GameMode.Adventure],
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

const KIT_DELAY_TICKS = 60;

function onJoin(player: Player): void {
	system.runTimeout(() => player.isValid && giveStarterKit(player), KIT_DELAY_TICKS);
	const shouldBuild = !isFrozenWorld() && !world.getDynamicProperty(BUILT_KEY) && world.getAbsoluteTime() < NEW_WORLD_TICKS;
	if (shouldBuild) {
		tryBuildArendelle(player, BUILD_RETRIES);
	} else {
		system.runTimeout(() => player.isValid && announceChapter(player), 120);
	}
}

const HEARTS: [string, string][] = [["anna", "Anna"], ["elsa", "Elsa"], ["kristoff", "Kristoff"], ["olaf", "Olaf"], ["hans", "Hans"]];

/** Telltale-style relationship summary for the storybook. */
function relationships(): string {
	const rel = storyState().rel;
	return HEARTS.map(([id, name]) => {
		const score = rel[id] ?? 0;
		const hearts = score > 0 ? "§c" + "♥".repeat(Math.min(score, 5)) : score < 0 ? "§8" + "✗".repeat(Math.min(-score, 5)) : "§7-";
		return `§f${name}: ${hearts}`;
	}).join("§r   ");
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
				storyText(id, "title"),
				{ text: "§r\n" },
				storyText(id, "goal"),
				{ text: "\n\n§7" },
				storyText(id, "hint"),
				{ text: "\n\n§r" + relationships() },
			],
		})
		.button({ translate: "frozen.storybook.close" });
	if (canBuild) form.button({ translate: "frozen.storybook.build" });
	for (const [key] of GAME_MODES) form.button({ translate: key });

	const response = await form.show(player);
	if (response.canceled || response.selection === undefined || response.selection === 0) return;
	const modeIndex = response.selection - (canBuild ? 2 : 1);
	if (modeIndex >= 0) {
		const [key, mode] = GAME_MODES[modeIndex];
		player.setGameMode(mode);
		player.sendMessage({ rawtext: [{ translate: "frozen.storybook.mode_set" }, { translate: key }] });
		return;
	}
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
