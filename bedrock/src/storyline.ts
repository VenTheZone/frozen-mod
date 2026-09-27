// The Frozen campaign as pure data, so the chapter flow can be unit tested without the game.

export type StoryEvent =
	| { kind: "talk"; entity: string }
	| { kind: "kill"; entity: string }
	| { kind: "has_item"; item: string }
	| { kind: "true_love" };

export interface Chapter {
	/** Lang keys: frozen.story.<id>.title / .goal / .hint */
	id: string;
	done: (event: StoryEvent) => boolean;
	/** Short goal for the always-visible sidebar tracker (English: scoreboard text can't be translated). */
	tracker: string;
	/** What the compass points at: the nearest of these characters, or "castle" for the Ice Palace. */
	guide?: string[];
}

const talkTo = (entity: string) => (e: StoryEvent) => e.kind === "talk" && e.entity === entity;
const defeat = (entity: string) => (e: StoryEvent) => e.kind === "kill" && e.entity === entity;

export const CHAPTERS: Chapter[] = [
	{ id: "coronation", done: talkTo("frozen:anna"), tracker: "Talk to Anna", guide: ["frozen:anna"] },
	{ id: "open_door", done: talkTo("frozen:hans"), tracker: "Meet Prince Hans", guide: ["frozen:hans"] },
	{ id: "let_it_go", done: talkTo("frozen:elsa"), tracker: "Talk to Queen Elsa", guide: ["frozen:elsa"] },
	{ id: "oakens", done: talkTo("frozen:kristoff"), tracker: "Find Kristoff at Oaken's", guide: ["frozen:kristoff"] },
	{ id: "in_summer", done: talkTo("frozen:olaf"), tracker: "Meet Olaf", guide: ["frozen:olaf"] },
	{ id: "north_mountain", done: talkTo("frozen:elsa"), tracker: "Find Elsa at the Ice Palace", guide: ["frozen:elsa", "castle"] },
	{ id: "marshmallow", done: defeat("frozen:marshmallow"), tracker: "Defeat Marshmallow", guide: ["frozen:marshmallow"] },
	{ id: "fixer_upper", done: talkTo("frozen:pabbie"), tracker: "Visit the trolls", guide: ["frozen:pabbie"] },
	{ id: "frozen_heart", done: (e) => e.kind === "has_item" && e.item === "frozen:true_love_heart", tracker: "Craft an Act of True Love" },
	{ id: "hans_betrayal", done: defeat("frozen:hans"), tracker: "Stop Prince Hans", guide: ["frozen:hans"] },
	{ id: "true_love", done: (e) => e.kind === "true_love", tracker: "Give true love to Anna or Elsa", guide: ["frozen:anna", "frozen:elsa"] },
];

/** Blocks the player must travel before an Ice Palace rises (worlds without one). */
export const CASTLE_TRAVEL_DISTANCE = 120;

export function isComplete(chapter: number): boolean {
	return chapter >= CHAPTERS.length;
}

export function chapterId(chapter: number): string | undefined {
	return CHAPTERS[chapter]?.id;
}

export function chapterIndex(id: string): number {
	return CHAPTERS.findIndex((c) => c.id === id);
}

/** Returns the next chapter index if the event completes the current chapter, otherwise the same index. */
export function advance(chapter: number, event: StoryEvent): number {
	const current = CHAPTERS[chapter];
	return current && current.done(event) ? chapter + 1 : chapter;
}

export function horizontalDistance(a: { x: number; z: number }, b: { x: number; z: number }): number {
	return Math.hypot(a.x - b.x, a.z - b.z);
}
