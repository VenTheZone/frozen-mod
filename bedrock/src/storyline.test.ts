import assert from "node:assert/strict";
import { test } from "node:test";
import { advance, CHAPTERS, chapterId, chapterIndex, horizontalDistance, isComplete } from "./storyline.ts";
import type { StoryEvent } from "./storyline.ts";

const PLAYTHROUGH: StoryEvent[] = [
	{ kind: "talk", entity: "frozen:anna" },
	{ kind: "talk", entity: "frozen:hans" },
	{ kind: "talk", entity: "frozen:elsa" },
	{ kind: "talk", entity: "frozen:kristoff" },
	{ kind: "talk", entity: "frozen:olaf" },
	{ kind: "talk", entity: "frozen:elsa" },
	{ kind: "kill", entity: "frozen:marshmallow" },
	{ kind: "talk", entity: "frozen:pabbie" },
	{ kind: "has_item", item: "frozen:true_love_heart" },
	{ kind: "kill", entity: "frozen:hans" },
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
	assert.equal(advance(chapterIndex("hans_betrayal"), { kind: "talk", entity: "frozen:hans" }), chapterIndex("hans_betrayal"));
	assert.equal(advance(chapterIndex("marshmallow"), { kind: "kill", entity: "minecraft:zombie" }), chapterIndex("marshmallow"));
});

test("finished story ignores further events", () => {
	assert.equal(advance(CHAPTERS.length, { kind: "true_love" }), CHAPTERS.length);
	assert.equal(chapterId(CHAPTERS.length), undefined);
});

test("chapter ids are unique and every chapter has a short tracker line", () => {
	assert.equal(new Set(CHAPTERS.map((c) => c.id)).size, CHAPTERS.length);
	assert.ok(CHAPTERS.every((c) => c.tracker.length > 0 && c.tracker.length <= 32));
});

test("horizontalDistance ignores height", () => {
	assert.equal(horizontalDistance({ x: 0, z: 0 }, { x: 3, z: 4 }), 5);
});
