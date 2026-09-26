import { EquipmentSlot, GameMode, ItemStack, Player, RawMessage, system, Vector3, world } from "@minecraft/server";
import { spawnMarkersIn } from "./spawns.ts";
import { advance, CASTLE_REACH_DISTANCE, CASTLE_TRAVEL_DISTANCE, chapterId, CHAPTERS, horizontalDistance } from "./storyline.ts";
import type { StoryEvent } from "./storyline.ts";
import { endWinter, isWinterActive, startWinter } from "./winter.ts";

const CHAPTER_KEY = "frozen:story_chapter";
const JOURNEY_KEY = "frozen:journey_start";
const CASTLE_KEY = "frozen:story_castle";
const HEART = "frozen:true_love_heart";
const CURERS = new Set(["frozen:elsa", "frozen:anna"]);
const CASTLE = { name: "frozen:ice_castle", size: { x: 17, y: 38, z: 17 }, foundation: 4, half: 8, ahead: 40 };
const STORY_INTERVAL = 40;

export function currentChapter(): number {
	const value = world.getDynamicProperty(CHAPTER_KEY);
	return typeof value === "number" ? value : 0;
}

/** Lang-key id for the current chapter, or "complete" once the story is over. */
export function currentChapterKey(): string {
	return chapterId(currentChapter()) ?? "complete";
}

export function announceChapter(target?: Player): void {
	const id = currentChapterKey();
	const title: RawMessage = { translate: `frozen.story.${id}.title` };
	const goal: RawMessage = { translate: `frozen.story.${id}.goal` };
	for (const player of target ? [target] : world.getAllPlayers()) {
		player.onScreenDisplay.setTitle(title, { subtitle: goal, fadeInDuration: 10, stayDuration: 80, fadeOutDuration: 20 });
		player.sendMessage({ rawtext: [{ text: "§b" }, title, { text: "§r - " }, goal] });
	}
}

export function give(player: Player, stack: ItemStack): void {
	const leftover = player.getComponent("minecraft:inventory")?.container.addItem(stack) ?? stack;
	if (leftover) player.dimension.spawnItem(leftover, player.location);
}

export function storyEvent(player: Player, event: StoryEvent): void {
	const before = currentChapter();
	const after = advance(before, event);
	if (after === before) return;
	world.setDynamicProperty(CHAPTER_KEY, after);
	completeChapter(CHAPTERS[before].id, player);
	announceChapter();
}

function completeChapter(id: string, player: Player): void {
	switch (id) {
		case "let_it_go":
			system.runTimeout(() => elsaFlees(player), 20);
			break;
		case "ice_harvester":
			give(player, new ItemStack("minecraft:carrot", 16));
			break;
		case "warm_hugs":
			world.setDynamicProperty(JOURNEY_KEY, player.location);
			break;
		case "true_love":
			give(player, new ItemStack("frozen:snowflake_crystal", 8));
			break;
	}
}

function elsaFlees(player: Player): void {
	if (!player.isValid) return;
	const [elsa] = player.dimension.getEntities({ type: "frozen:elsa", location: player.location, maxDistance: 16, closest: 1 });
	elsa?.remove();
	world.sendMessage({ translate: "frozen.story.elsa_fled" });
	startWinter();
}

function hasItem(player: Player, typeId: string): boolean {
	const container = player.getComponent("minecraft:inventory")?.container;
	if (!container) return false;
	for (let slot = 0; slot < container.size; slot++) {
		if (container.getItem(slot)?.typeId === typeId) return true;
	}
	return false;
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
		world.structureManager.place(CASTLE.name, player.dimension, origin);
		world.setDynamicProperty(CASTLE_KEY, { x: cx, y: floorY, z: cz });
		system.runTimeout(() => spawnMarkersIn(player.dimension, origin, CASTLE.size), 2);
		world.sendMessage({ translate: "frozen.story.castle_appears" });
	} catch {
		// target chunk not loaded yet; the next check retries
	}
}

function journeyToCastle(player: Player): void {
	const castle = world.getDynamicProperty(CASTLE_KEY) as Vector3 | undefined;
	if (castle) {
		if (horizontalDistance(player.location, castle) <= CASTLE_REACH_DISTANCE) storyEvent(player, { kind: "reach_castle" });
		return;
	}
	const start = world.getDynamicProperty(JOURNEY_KEY) as Vector3 | undefined;
	if (!start) {
		world.setDynamicProperty(JOURNEY_KEY, player.location);
	} else if (horizontalDistance(player.location, start) >= CASTLE_TRAVEL_DISTANCE) {
		raiseCastleAhead(player);
	}
}

function tickStory(): void {
	const id = chapterId(currentChapter());
	if (id === "north_mountain") {
		for (const player of world.getDimension("overworld").getPlayers()) journeyToCastle(player);
	} else if (id === "frozen_heart") {
		for (const player of world.getAllPlayers()) {
			if (hasItem(player, HEART)) storyEvent(player, { kind: "has_item", item: HEART });
		}
	}
}

/** The Act of True Love ends the winter, and finishes the story on its last chapter. */
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
	endWinter();
	storyEvent(player, { kind: "true_love" });
}

export function registerStory(): void {
	world.afterEvents.playerInteractWithEntity.subscribe(({ player, target }) => {
		if (target.typeId.startsWith("frozen:")) storyEvent(player, { kind: "talk", entity: target.typeId });
	});
	world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
		if (deadEntity.typeId !== "frozen:marshmallow") return;
		const killer = damageSource.damagingEntity instanceof Player ? damageSource.damagingEntity : world.getAllPlayers()[0];
		if (killer) storyEvent(killer, { kind: "kill", entity: deadEntity.typeId });
	});
	world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
		if (event.itemStack?.typeId !== HEART || !CURERS.has(event.target.typeId)) return;
		event.cancel = true;
		const player = event.player;
		system.run(() => useHeart(player));
	});
	system.runInterval(tickStory, STORY_INTERVAL);
}
