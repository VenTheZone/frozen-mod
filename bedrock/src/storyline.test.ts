import assert from "node:assert/strict";
import { test } from "node:test";
import { advance, CHAPTERS, chapterId, horizontalDistance, isComplete } from "./storyline.ts";
import type { StoryEvent } from "./storyline.ts";

const PLAYTHROUGH: StoryEvent[] = [
	{ kind: "talk", entity: "frozen:anna" },
	{ kind: "talk", entity: "frozen:elsa" },
	{ kind: "talk", entity: "frozen:kristoff" },
	{ kind: "talk", entity: "frozen:olaf" },
	{ kind: "reach_castle" },
	{ kind: "kill", entity: "frozen:marshmallow" },
	{ kind: "has_item", item: "frozen:true_love_heart" },
	{ kind: "true_love" },
];

test("a full playthrough completes every chapter in order", () => {
	let chapter = 0;
	for (const event of PLAYTHROUGH) {
		const next = advance(chapter, event);
		assert.equal(next, chapter + 1, `event ${JSON.stringify(event)} should finish ${chapterId(chapter)}`);
		chapter = next;
	}
	assert.ok(isComplete(chapter));
	assert.equal(chapter, CHAPTERS.length);
});

test("events for other chapters do not skip ahead", () => {
	assert.equal(advance(0, { kind: "talk", entity: "frozen:elsa" }), 0);
	assert.equal(advance(0, { kind: "kill", entity: "frozen:marshmallow" }), 0);
	assert.equal(advance(4, { kind: "talk", entity: "frozen:anna" }), 4);
	assert.equal(advance(5, { kind: "kill", entity: "minecraft:zombie" }), 5);
});

test("finished story ignores further events", () => {
	assert.equal(advance(CHAPTERS.length, { kind: "true_love" }), CHAPTERS.length);
	assert.equal(chapterId(CHAPTERS.length), undefined);
});

test("chapter ids are unique", () => {
	assert.equal(new Set(CHAPTERS.map((c) => c.id)).size, CHAPTERS.length);
});

test("horizontalDistance ignores height", () => {
	assert.equal(horizontalDistance({ x: 0, z: 0 }, { x: 3, z: 4 }), 5);
});
