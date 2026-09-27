import { Container, Entity, Player, system, world } from "@minecraft/server";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { AMBIENT, CAMPAIGN, OFFERS } from "./campaign.ts";
import { applyEffects, visibleChoices } from "./conversation-logic.ts";
import type { Choice, Conversation, DialogueNode, Effects } from "./conversation-logic.ts";
import { notify } from "./guide.ts";
import { missingForTrade } from "./logic.ts";
import { currentChapterKey, freezeHeart, give, hasItem, saveStoryState, storyEvent, storyState } from "./story.ts";
import { isWinterActive, startWinter } from "./winter.ts";

export const TALKERS = ["anna", "elsa", "kristoff", "olaf", "hans", "duke", "oaken", "kai", "gerda", "pabbie", "troll", "guard", "townsfolk"];
const NAMES: Record<string, string> = {
	anna: "Anna", elsa: "Elsa", kristoff: "Kristoff", olaf: "Olaf", hans: "Hans", duke: "Duke of Weselton", oaken: "Oaken",
	kai: "Kai", gerda: "Gerda", pabbie: "Grand Pabbie", troll: "Troll", guard: "Royal Guard", townsfolk: "Townsperson",
};
const CARROT = "minecraft:carrot";
/** One conversation at a time per player, and a pause after it closes, so a held tap can't reopen it. */
const COOLDOWN_TICKS = 40;
const busy = new Set<string>();
const readyAt = new Map<string, number>();

function counts(container: Container): Record<string, number> {
	const have: Record<string, number> = {};
	for (let slot = 0; slot < container.size; slot++) {
		const item = container.getItem(slot);
		if (item) have[item.typeId] = (have[item.typeId] ?? 0) + item.amount;
	}
	return have;
}

function take(player: Player, typeId: string, amount: number): void {
	const container = player.getComponent("minecraft:inventory")?.container;
	if (!container) return;
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

async function showTrades(player: Player, npc: string): Promise<void> {
	const offers = OFFERS[npc] ?? [];
	const form = new ActionFormData().title(NAMES[npc]).body("What would you like?");
	for (const offer of offers) form.button(offer.label);
	form.button("Goodbye");
	const response = await form.show(player);
	const offer = response.selection === undefined ? undefined : offers[response.selection];
	const container = player.getComponent("minecraft:inventory")?.container;
	if (!offer || !container) return;
	if (missingForTrade(counts(container), offer.wants).length > 0) {
		notify(player, { translate: "frozen.trade.missing" });
	} else {
		for (const [id, n] of offer.wants) take(player, id, n);
		give(player, offer.gives[0], offer.gives[1]);
		player.playSound("random.orb");
		notify(player, { translate: "frozen.trade.done" });
	}
	await showTrades(player, npc);
}

/** Runs the side effects named in the script once the conversation is over. */
async function runAction(action: string, player: Player, target: Entity): Promise<void> {
	const [kind, ...rest] = action.split(":");
	if (kind === "give" || kind === "take") {
		const amount = Number(rest.pop());
		const item = rest.join(":");
		if (kind === "give") give(player, item, amount);
		else take(player, item, amount);
	} else if (kind === "trade") {
		await showTrades(player, rest[0]);
	} else if (action === "elsa_flee") {
		system.runTimeout(() => {
			if (target.isValid) target.remove();
			world.sendMessage({ translate: "frozen.story.elsa_fled" });
			startWinter(true);
		}, 20);
	} else if (action === "olaf_follow") {
		target.getComponent("minecraft:tameable")?.tame(player);
	} else if (action === "frozen_heart") {
		freezeHeart(player);
	} else if (action === "hans_hostile") {
		target.triggerEvent("frozen:betray");
		world.sendMessage({ translate: "frozen.story.hans_betrays" });
	}
}

/** Plays a conversation. Choices and actions only take effect if the player reaches the end. */
async function play(player: Player, target: Entity, conv: Conversation): Promise<boolean> {
	let state = storyState();
	const actions: string[] = [];
	let nodeId: string | undefined = conv.start;
	while (nodeId) {
		const node: DialogueNode = conv.nodes[nodeId];
		const choices = visibleChoices(node, state, (id) => hasItem(player, id));
		const form: ActionFormData = new ActionFormData().title(node.speaker).body(node.text);
		for (const choice of choices) form.button(choice.text);
		if (choices.length === 0) form.button("Goodbye");
		const response: ActionFormResponse = await form.show(player);
		if (response.canceled || response.selection === undefined) return false;
		const choice: Choice | undefined = choices[response.selection];
		if (!choice) break;
		const effects: Effects | undefined = choice.effects;
		state = applyEffects(state, effects);
		actions.push(...(effects?.actions ?? []));
		if (effects?.remember) notify(player, { rawtext: [{ text: `§7§o${effects.remember} will remember that.` }] });
		nodeId = choice.next;
	}
	saveStoryState(state);
	for (const action of actions) await runAction(action, player, target);
	return true;
}

async function ambient(player: Player, npc: string): Promise<void> {
	const lines = AMBIENT[npc];
	if (!lines) return;
	const pool = isWinterActive() && lines.winterLines ? lines.winterLines : lines.lines;
	const form = new ActionFormData().title(NAMES[npc]).body(pool[Math.floor(Math.random() * pool.length)]);
	if (lines.trade) form.button("Trade");
	form.button("Goodbye");
	const response = await form.show(player);
	if (lines.trade && response.selection === 0) await showTrades(player, npc);
}

async function talk(player: Player, target: Entity): Promise<void> {
	const npc = target.typeId.replace("frozen:", "");
	const scripted = CAMPAIGN[currentChapterKey()]?.[npc];
	if (scripted) {
		if (await play(player, target, scripted)) storyEvent(player, { kind: "talk", entity: target.typeId });
	} else {
		await ambient(player, npc);
	}
}

function onTalk(player: Player, target: Entity): void {
	const npc = target.typeId.replace("frozen:", "");
	if (!target.typeId.startsWith("frozen:") || !TALKERS.includes(npc)) return;
	if (busy.has(player.id) || system.currentTick < (readyAt.get(player.id) ?? 0)) return;
	busy.add(player.id);
	talk(player, target)
		.catch((error) => console.warn(`[frozen] conversation failed: ${error}`))
		.finally(() => {
			busy.delete(player.id);
			readyAt.set(player.id, system.currentTick + COOLDOWN_TICKS);
		});
}

export function registerConversations(): void {
	world.afterEvents.playerInteractWithEntity.subscribe(({ player, target, itemStack }) => {
		// Feeding Olaf a carrot is taming, not talking.
		if (target.typeId === "frozen:olaf" && itemStack?.typeId === CARROT) return;
		onTalk(player, target);
	});
	// Backup path: the Talk button fires this entity event even if the interact event above does not.
	world.afterEvents.dataDrivenEntityTrigger.subscribe(({ entity, eventId }) => {
		if (eventId !== "frozen:talked") return;
		const [player] = entity.dimension.getPlayers({ location: entity.location, maxDistance: 8, closest: 1 });
		if (player) onTalk(player, entity);
	});
}
