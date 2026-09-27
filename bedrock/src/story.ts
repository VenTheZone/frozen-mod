import { EquipmentSlot, GameMode, ItemStack, ItemTypes, Player, RawMessage, system, Vector3, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { choicesRecap, endingLines } from "./campaign.ts";
import { EMPTY_STATE } from "./conversation-logic.ts";
import type { StoryState } from "./conversation-logic.ts";
import { placeStructure, spawnMarkersIn } from "./spawns.ts";
import { advance, CASTLE_TRAVEL_DISTANCE, chapterId, CHAPTERS, horizontalDistance } from "./storyline.ts";
import type { StoryEvent } from "./storyline.ts";
import { endWinter, isWinterActive } from "./winter.ts";

const CHAPTER_KEY = "frozen:story_chapter";
const STATE_KEY = "frozen:story_state";
const JOURNEY_KEY = "frozen:journey_start";
const CASTLE_KEY = "frozen:story_castle";
const FROZEN_HEART_KEY = "frozen:frozen_heart";
const HEART = "frozen:true_love_heart";
const CURERS = new Set(["frozen:elsa", "frozen:anna"]);
const CASTLE = { name: "frozen:ice_castle", size: { x: 17, y: 38, z: 17 }, foundation: 4, half: 8, ahead: 40 };
const STORY_INTERVAL = 40;
const CURSE_TICKS = 260;

export function currentChapter(): number {
	const value = world.getDynamicProperty(CHAPTER_KEY);
	return typeof value === "number" ? value : 0;
}

/** Lang-key id for the current chapter, or "complete" once the story is over. */
export function currentChapterKey(): string {
	return chapterId(currentChapter()) ?? "complete";
}

export function storyState(): StoryState {
	const raw = world.getDynamicProperty(STATE_KEY);
	if (typeof raw !== "string") return EMPTY_STATE;
	try {
		const parsed = JSON.parse(raw) as StoryState;
		return { flags: parsed.flags ?? [], rel: parsed.rel ?? {} };
	} catch {
		return EMPTY_STATE;
	}
}

export function saveStoryState(state: StoryState): void {
	world.setDynamicProperty(STATE_KEY, JSON.stringify(state));
}

/** Worlds built on the Ghiacciata map set map=1 on the frozen_world scoreboard to get place-specific hints. */
function onArendelleMap(): boolean {
	return world.scoreboard.getObjective("frozen_world")?.getScore("map") === 1;
}

/** Story text for a chapter part, using the map-specific variant (.arendelle) for hints. */
export function storyText(id: string, part: "title" | "goal" | "hint"): RawMessage {
	const key = `frozen.story.${id}.${part}`;
	return { translate: part === "hint" && onArendelleMap() ? `${key}.arendelle` : key };
}

/** The one announcement per chapter: a title on screen and a single chat line. */
export function announceChapter(target?: Player): void {
	const id = currentChapterKey();
	const title = storyText(id, "title");
	const goal = storyText(id, "goal");
	for (const player of target ? [target] : world.getAllPlayers()) {
		player.onScreenDisplay.setTitle(title, { subtitle: goal, fadeInDuration: 10, stayDuration: 120, fadeOutDuration: 20 });
		player.sendMessage({ rawtext: [{ text: "§b" }, title, { text: "§r - " }, goal] });
	}
}

/** Gives an item, dropping it at the player's feet if the inventory is full. Returns false for unknown items. */
export function give(player: Player, typeId: string, amount = 1): boolean {
	if (!ItemTypes.get(typeId)) {
		console.warn(`[frozen] unknown item ${typeId}`);
		return false;
	}
	const stack = new ItemStack(typeId, amount);
	const leftover = player.getComponent("minecraft:inventory")?.container.addItem(stack) ?? stack;
	if (leftover) player.dimension.spawnItem(leftover, player.location);
	return true;
}

export function hasItem(player: Player, typeId: string): boolean {
	const container = player.getComponent("minecraft:inventory")?.container;
	if (!container) return false;
	for (let slot = 0; slot < container.size; slot++) {
		if (container.getItem(slot)?.typeId === typeId) return true;
	}
	return false;
}

/** Advances the story if the event finishes the current chapter. Returns true when it did. */
export function storyEvent(player: Player, event: StoryEvent): boolean {
	const before = currentChapter();
	const after = advance(before, event);
	if (after === before) return false;
	world.setDynamicProperty(CHAPTER_KEY, after);
	if (CHAPTERS[before].id === "true_love") {
		system.runTimeout(() => void showEnding(player), 20);
	} else {
		system.runTimeout(() => announceChapter(), 30);
	}
	return true;
}

/** Elsa's blast in chapter 6: slowness and weakness until an act of true love. */
export function freezeHeart(player: Player): void {
	player.setDynamicProperty(FROZEN_HEART_KEY, true);
	applyCurse(player);
}

function applyCurse(player: Player): void {
	player.addEffect("slowness", CURSE_TICKS, { amplifier: 0, showParticles: false });
	player.addEffect("weakness", CURSE_TICKS, { amplifier: 0, showParticles: false });
}

async function showEnding(player: Player): Promise<void> {
	const state = storyState();
	const recap = choicesRecap(state);
	player.onScreenDisplay.setTitle({ translate: "frozen.story.complete.title" }, { subtitle: { translate: "frozen.story.complete.goal" }, fadeInDuration: 10, stayDuration: 100, fadeOutDuration: 20 });
	const body = [...endingLines(state), "", "§lYour choices§r", ...(recap.length ? recap : ["You kept your thoughts to yourself."])].join("\n\n");
	await new ActionFormData().title("The End").body(body).button("Thank you for playing!").show(player);
}

function raiseCastleAhead(player: Player): void {
	const dir = player.getViewDirection();
	const len = Math.hypot(dir.x, dir.z) || 1;
	const cx = Math.floor(player.location.x + (dir.x / len) * CASTLE.ahead);
	const cz = Math.floor(player.location.z + (dir.z / len) * CASTLE.ahead);
	try {
		const top = player.dimension.getTopmostBlock({ x: cx, z: cz });
		if (!top) return;
		const floorY = top.location.y + 1;
		const origin = { x: cx - CASTLE.half, y: floorY - CASTLE.foundation, z: cz - CASTLE.half };
		placeStructure(CASTLE.name, player.dimension, origin);
		world.setDynamicProperty(CASTLE_KEY, { x: cx, y: floorY, z: cz });
		system.runTimeout(() => spawnMarkersIn(player.dimension, origin, CASTLE.size), 2);
		world.sendMessage({ translate: "frozen.story.castle_appears" });
	} catch {
		// target chunk not loaded yet; the next check retries
	}
}

/** The Frozen World's setup functions record where they built the Ice Palace. */
function worldCastle(): Vector3 | undefined {
	const scores = world.scoreboard.getObjective("frozen_world");
	const x = scores?.getScore("castle_x");
	const z = scores?.getScore("castle_z");
	return x === undefined || z === undefined ? undefined : { x, y: 0, z };
}

/** Where the Ice Palace for chapter 6 is, once known. */
export function storyCastle(): Vector3 | undefined {
	return worldCastle() ?? (world.getDynamicProperty(CASTLE_KEY) as Vector3 | undefined);
}

/** Worlds without a palace get one raised ahead of the player after a long enough journey. */
function journeyToCastle(player: Player): void {
	if (storyCastle()) return;
	const start = world.getDynamicProperty(JOURNEY_KEY) as Vector3 | undefined;
	if (!start) {
		world.setDynamicProperty(JOURNEY_KEY, player.location);
	} else if (horizontalDistance(player.location, start) >= CASTLE_TRAVEL_DISTANCE) {
		raiseCastleAhead(player);
	}
}

function tickStory(): void {
	const id = chapterId(currentChapter());
	for (const player of world.getAllPlayers()) {
		if (player.getDynamicProperty(FROZEN_HEART_KEY) === true) applyCurse(player);
		if (id === "north_mountain" && player.dimension.id === "minecraft:overworld") journeyToCastle(player);
		if (id === "frozen_heart" && hasItem(player, HEART)) storyEvent(player, { kind: "has_item", item: HEART });
	}
}

/** The Act of True Love ends the winter and the frozen-heart curse, and finishes the story on its last chapter. */
function useHeart(player: Player): void {
	const storyNeedsIt = chapterId(currentChapter()) === "true_love";
	if (!isWinterActive() && !storyNeedsIt) {
		player.onScreenDisplay.setActionBar({ translate: "frozen.winter.none" });
		return;
	}
	if (player.getGameMode() !== GameMode.Creative) {
		const equippable = player.getComponent("minecraft:equippable");
		const stack = equippable?.getEquipment(EquipmentSlot.Mainhand);
		if (equippable && stack?.typeId === HEART) {
			if (stack.amount > 1) {
				stack.amount -= 1;
				equippable.setEquipment(EquipmentSlot.Mainhand, stack);
			} else {
				equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
			}
		}
	}
	player.dimension.playSound("block.amethyst_block.resonate", player.location);
	for (const p of world.getAllPlayers()) {
		p.setDynamicProperty(FROZEN_HEART_KEY, false);
		p.removeEffect("slowness");
		p.removeEffect("weakness");
	}
	endWinter();
	storyEvent(player, { kind: "true_love" });
}

export function registerStory(): void {
	world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
		const id = deadEntity.typeId;
		if (id !== "frozen:marshmallow" && id !== "frozen:hans") return;
		const killer = damageSource.damagingEntity instanceof Player ? damageSource.damagingEntity : world.getAllPlayers()[0];
		if (killer && storyEvent(killer, { kind: "kill", entity: id }) && id === "frozen:hans") {
			world.sendMessage({ translate: "frozen.story.hans_defeated" });
		}
	});
	world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
		if (event.itemStack?.typeId !== HEART || !CURERS.has(event.target.typeId)) return;
		event.cancel = true;
		const player = event.player;
		system.run(() => useHeart(player));
	});
	system.runInterval(tickStory, STORY_INTERVAL);
}
