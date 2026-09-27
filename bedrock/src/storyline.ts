// The Frozen storyline as pure data, so the chapter flow can be unit tested without the game.

export type StoryEvent =
	| { kind: "talk"; entity: string }
	| { kind: "kill"; entity: string }
	| { kind: "reach_castle" }
	| { kind: "has_item"; item: string }
	| { kind: "true_love" };

export interface Chapter {
	/** Lang keys: frozen.story.<id>.title / .goal / .hint */
	id: string;
	done: (event: StoryEvent) => boolean;
	/** What the on-screen compass points at: the nearest of these characters, or "castle" for the Ice Palace. */
	guide?: string[];
}

const talkTo = (entity: string) => (e: StoryEvent) => e.kind === "talk" && e.entity === entity;

export const CHAPTERS: Chapter[] = [
	{ id: "coronation", done: talkTo("frozen:anna"), guide: ["frozen:anna"] },
	{ id: "let_it_go", done: talkTo("frozen:elsa"), guide: ["frozen:elsa"] },
	{ id: "ice_harvester", done: talkTo("frozen:kristoff"), guide: ["frozen:kristoff"] },
	{ id: "warm_hugs", done: talkTo("frozen:olaf"), guide: ["frozen:olaf"] },
	{ id: "north_mountain", done: (e) => e.kind === "reach_castle", guide: ["castle"] },
	{ id: "marshmallow", done: (e) => e.kind === "kill" && e.entity === "frozen:marshmallow", guide: ["frozen:marshmallow"] },
	{ id: "frozen_heart", done: (e) => e.kind === "has_item" && e.item === "frozen:true_love_heart" },
	{ id: "true_love", done: (e) => e.kind === "true_love", guide: ["frozen:anna", "frozen:elsa"] },
];

/** Blocks the player must travel from where chapter 5 starts before the Ice Castle rises. */
export const CASTLE_TRAVEL_DISTANCE = 120;
/** How close counts as having reached the castle. */
export const CASTLE_REACH_DISTANCE = 16;

export function isComplete(chapter: number): boolean {
	return chapter >= CHAPTERS.length;
}

export function chapterId(chapter: number): string | undefined {
	return CHAPTERS[chapter]?.id;
}

/** Returns the next chapter index if the event completes the current chapter, otherwise the same index. */
export function advance(chapter: number, event: StoryEvent): number {
	const current = CHAPTERS[chapter];
	return current && current.done(event) ? chapter + 1 : chapter;
}

export function horizontalDistance(a: { x: number; z: number }, b: { x: number; z: number }): number {
	return Math.hypot(a.x - b.x, a.z - b.z);
}
