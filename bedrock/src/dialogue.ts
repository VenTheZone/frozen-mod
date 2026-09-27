import { Container, Entity, Player, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { missingForTrade } from "./logic.ts";
import { give, storyEvent } from "./story.ts";

/** Characters with a Talk button. Lang keys: frozen.talk.<name>.story (their chapter) and .default.1..N. */
const TALKERS = ["anna", "elsa", "kristoff", "olaf"];
const DEFAULT_LINES = 3;
const CARROT = "minecraft:carrot";
/** The Talk interaction and its entity event can both report the same tap; handle it once. */
const DEDUPE_TICKS = 5;

interface Offer {
	label: string;
	wants: [string, number][];
	gives: [string, number];
}

const OFFERS: Record<string, Offer[]> = {
	elsa: [
		{ label: "frozen.trade.elsa.glove", wants: [["minecraft:emerald", 16], ["minecraft:leather", 1]], gives: ["frozen:elsa_glove", 1] },
		{ label: "frozen.trade.elsa.crystal", wants: [["minecraft:emerald", 6]], gives: ["frozen:snowflake_crystal", 1] },
		{ label: "frozen.trade.elsa.ice", wants: [["minecraft:packed_ice", 16]], gives: ["minecraft:emerald", 1] },
	],
	kristoff: [
		{ label: "frozen.trade.kristoff.packed_ice", wants: [["minecraft:emerald", 1]], gives: ["minecraft:packed_ice", 8] },
		{ label: "frozen.trade.kristoff.blue_ice", wants: [["minecraft:emerald", 3]], gives: ["minecraft:blue_ice", 4] },
		{ label: "frozen.trade.kristoff.carrots", wants: [[CARROT, 12]], gives: ["minecraft:emerald", 1] },
		{ label: "frozen.trade.kristoff.saddle", wants: [["minecraft:emerald", 6]], gives: ["minecraft:saddle", 1] },
	],
};

const lastTalk = new Map<string, number>();

function counts(container: Container): Record<string, number> {
	const have: Record<string, number> = {};
	for (let slot = 0; slot < container.size; slot++) {
		const item = container.getItem(slot);
		if (item) have[item.typeId] = (have[item.typeId] ?? 0) + item.amount;
	}
	return have;
}

function take(container: Container, typeId: string, amount: number): void {
	for (let slot = 0; slot < container.size && amount > 0; slot++) {
		const item = container.getItem(slot);
		if (item?.typeId !== typeId) continue;
		const used = Math.min(item.amount, amount);
		amount -= used;
		if (used === item.amount) {
			container.setItem(slot, undefined);
		} else {
			item.amount -= used;
			container.setItem(slot, item);
		}
	}
}

async function showTrades(player: Player, name: string): Promise<void> {
	const offers = OFFERS[name];
	const form = new ActionFormData().title({ translate: `entity.frozen:${name}.name` }).body({ translate: "frozen.trade.body" });
	for (const offer of offers) form.button({ translate: offer.label });
	form.button({ translate: "frozen.dialogue.bye" });
	const response = await form.show(player);
	const offer = response.selection === undefined ? undefined : offers[response.selection];
	const container = player.getComponent("minecraft:inventory")?.container;
	if (!offer || !container) return;
	if (missingForTrade(counts(container), offer.wants).length > 0) {
		player.sendMessage({ translate: "frozen.trade.missing" });
	} else {
		for (const [id, n] of offer.wants) take(container, id, n);
		give(player, offer.gives[0], offer.gives[1]);
		player.playSound("random.orb");
		player.sendMessage({ translate: "frozen.trade.done" });
	}
	await showTrades(player, name);
}

async function talk(player: Player, target: Entity): Promise<void> {
	const name = target.typeId.replace("frozen:", "");
	const advanced = storyEvent(player, { kind: "talk", entity: target.typeId });
	const form = new ActionFormData()
		.title({ translate: `entity.${target.typeId}.name` })
		.body({ translate: `frozen.talk.${name}.${advanced ? "story" : `default.${1 + Math.floor(Math.random() * DEFAULT_LINES)}`}` });
	const canTrade = OFFERS[name] !== undefined;
	if (canTrade) form.button({ translate: "frozen.dialogue.trade" });
	form.button({ translate: "frozen.dialogue.bye" });
	const response = await form.show(player);
	if (canTrade && response.selection === 0) await showTrades(player, name);
}

function onTalk(player: Player, target: Entity): void {
	const name = target.typeId.replace("frozen:", "");
	if (!target.typeId.startsWith("frozen:") || !TALKERS.includes(name)) return;
	const now = system.currentTick;
	if (now - (lastTalk.get(target.id) ?? -DEDUPE_TICKS) < DEDUPE_TICKS) return;
	lastTalk.set(target.id, now);
	void talk(player, target);
}

export function registerDialogue(): void {
	world.afterEvents.playerInteractWithEntity.subscribe(({ player, target, itemStack }) => {
		if (target.typeId === "frozen:olaf" && itemStack?.typeId === CARROT) {
			storyEvent(player, { kind: "talk", entity: target.typeId });
			return;
		}
		onTalk(player, target);
	});
	// Backup path: the Talk button fires this entity event even if the interact event above does not.
	world.afterEvents.dataDrivenEntityTrigger.subscribe(({ entity, eventId }) => {
		if (eventId !== "frozen:talked") return;
		const [player] = entity.dimension.getPlayers({ location: entity.location, maxDistance: 8, closest: 1 });
		if (player) onTalk(player, entity);
	});
}
