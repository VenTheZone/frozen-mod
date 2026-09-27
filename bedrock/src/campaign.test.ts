import assert from "node:assert/strict";
import { test } from "node:test";
import { AMBIENT, CAMPAIGN, choicesRecap, endingLines, OFFERS } from "./campaign.ts";
import { applyEffects, conversationProblems, EMPTY_STATE, meets, reachableNodes, visibleChoices } from "./conversation-logic.ts";
import type { Choice, Conversation, StoryState } from "./conversation-logic.ts";
import { CHAPTERS } from "./storyline.ts";

const KNOWN_ACTIONS = /^(elsa_flee|hans_hostile|olaf_follow|frozen_heart|trade:(oaken|kristoff)|(give|take):[a-z_]+:[a-z_]+:\d+)$/;
const allConversations = () => Object.entries(CAMPAIGN).flatMap(([ch, byNpc]) => Object.entries(byNpc).map(([npc, c]) => [`${ch}/${npc}`, c] as const));

test("every campaign chapter exists in the storyline", () => {
	const ids = new Set(CHAPTERS.map((c) => c.id));
	for (const chapter of Object.keys(CAMPAIGN)) assert.ok(ids.has(chapter), chapter);
});

test("conversations are well formed and every node is reachable", () => {
	for (const [name, conv] of allConversations()) {
		assert.deepEqual(conversationProblems(conv), [], name);
		assert.equal(reachableNodes(conv).size, Object.keys(conv.nodes).length, `${name} has unreachable nodes`);
	}
});

test("every action in the script is one the game implements", () => {
	for (const [name, conv] of allConversations()) {
		for (const node of Object.values(conv.nodes)) {
			for (const choice of node.choices ?? []) {
				for (const action of choice.effects?.actions ?? []) assert.match(action, KNOWN_ACTIONS, `${name}: ${action}`);
			}
		}
	}
});

test("from every node at least one choice is always available, or it ends", () => {
	const nobody: StoryState = EMPTY_STATE;
	for (const [name, conv] of allConversations()) {
		for (const [id, node] of Object.entries(conv.nodes)) {
			if (!node.choices) continue;
			assert.ok(visibleChoices(node, nobody, () => false).length > 0, `${name}/${id} can dead-end`);
		}
	}
});

/** Walks every path; returns the actions seen on each ending path. */
function paths(conv: Conversation, id = conv.start, acc: string[] = []): string[][] {
	const choices: Choice[] = conv.nodes[id].choices ?? [];
	if (choices.length === 0) return [acc];
	return choices.flatMap((c) => (c.next ? paths(conv, c.next, [...acc, ...(c.effects?.actions ?? [])]) : [[...acc, ...(c.effects?.actions ?? [])]]));
}

test("story-critical actions happen on every path", () => {
	assert.ok(paths(CAMPAIGN.let_it_go.elsa).every((p) => p.includes("elsa_flee")));
	assert.ok(paths(CAMPAIGN.in_summer.olaf).every((p) => p.includes("olaf_follow")));
	assert.ok(paths(CAMPAIGN.north_mountain.elsa).every((p) => p.includes("frozen_heart")));
	assert.ok(paths(CAMPAIGN.hans_betrayal.hans).every((p) => p.includes("hans_hostile")));
	assert.ok(paths(CAMPAIGN.fixer_upper.pabbie).every((p) => p.includes("give:minecraft:diamond:1")));
});

test("requirements gate choices", () => {
	assert.ok(!meets({ flag: "doubted_hans" }, EMPTY_STATE, () => false));
	assert.ok(meets({ flag: "doubted_hans" }, { flags: ["doubted_hans"], rel: {} }, () => false));
	assert.ok(!meets({ minRel: ["kristoff", 2] }, { flags: [], rel: { kristoff: 1 } }, () => false));
	assert.ok(meets({ item: "minecraft:carrot" }, EMPTY_STATE, (id) => id === "minecraft:carrot"));
});

test("effects never mutate the previous state", () => {
	const before: StoryState = { flags: ["a"], rel: { anna: 1 } };
	const after = applyEffects(before, { rel: { anna: 2, elsa: -1 }, flags: ["b", "a"] });
	assert.deepEqual(before, { flags: ["a"], rel: { anna: 1 } });
	assert.deepEqual(after, { flags: ["a", "b"], rel: { anna: 3, elsa: -1 } });
});

test("endings and recap reflect choices", () => {
	const kind: StoryState = { flags: ["hugged_olaf", "doubted_hans"], rel: { elsa: 2, kristoff: 2 } };
	assert.ok(endingLines(kind).some((l) => l.includes("ice rink")));
	assert.ok(endingLines(kind).some((l) => l.includes("brand-new sled")));
	assert.ok(endingLines(EMPTY_STATE).some((l) => l.includes("a little wider")));
	assert.deepEqual(choicesRecap(kind), ["You gave Olaf a warm hug.", "You doubted Prince Hans from the start."]);
});

test("every trader has offers and ambient lines", () => {
	for (const [npc, a] of Object.entries(AMBIENT)) {
		assert.ok(a.lines.length >= 3, npc);
		if (a.trade) assert.ok(OFFERS[npc]?.length, `${npc} trades but has no offers`);
	}
});
