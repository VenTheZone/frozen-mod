// Telltale-style dialogue model: pure data and functions, so every conversation can be tested without the game.

export interface StoryState {
	flags: string[];
	/** Relationship score per character name, e.g. { anna: 2, hans: -1 }. */
	rel: Record<string, number>;
}

export interface Requirement {
	flag?: string;
	notFlag?: string;
	/** Character and the minimum relationship needed. */
	minRel?: [string, number];
	/** Item the player must carry. */
	item?: string;
}

export interface Effects {
	rel?: Record<string, number>;
	flags?: string[];
	/** Side effects the game runs, e.g. "elsa_flee", "hans_hostile", "give:minecraft:carrot:16". */
	actions?: string[];
	/** Character name for the "... will remember that." notice. */
	remember?: string;
}

export interface Choice {
	text: string;
	next?: string;
	effects?: Effects;
	requires?: Requirement;
}

export interface DialogueNode {
	speaker: string;
	text: string;
	choices?: Choice[];
}

export interface Conversation {
	start: string;
	nodes: Record<string, DialogueNode>;
}

export const EMPTY_STATE: StoryState = { flags: [], rel: {} };

export function meets(req: Requirement | undefined, state: StoryState, hasItem: (id: string) => boolean): boolean {
	if (!req) return true;
	if (req.flag && !state.flags.includes(req.flag)) return false;
	if (req.notFlag && state.flags.includes(req.notFlag)) return false;
	if (req.minRel && (state.rel[req.minRel[0]] ?? 0) < req.minRel[1]) return false;
	if (req.item && !hasItem(req.item)) return false;
	return true;
}

/** Choices the player may pick right now; an empty list means the conversation ends after this line. */
export function visibleChoices(node: DialogueNode, state: StoryState, hasItem: (id: string) => boolean): Choice[] {
	return (node.choices ?? []).filter((c) => meets(c.requires, state, hasItem));
}

/** Returns a new state with the effects applied; the input is never modified. */
export function applyEffects(state: StoryState, effects: Effects | undefined): StoryState {
	if (!effects) return state;
	const rel = { ...state.rel };
	for (const [name, delta] of Object.entries(effects.rel ?? {})) rel[name] = (rel[name] ?? 0) + delta;
	const flags = [...state.flags];
	for (const flag of effects.flags ?? []) if (!flags.includes(flag)) flags.push(flag);
	return { flags, rel };
}

/** Problems in a conversation's structure (dangling links, missing start). Empty means valid. */
export function conversationProblems(conv: Conversation): string[] {
	const problems: string[] = [];
	if (!conv.nodes[conv.start]) problems.push(`start node "${conv.start}" missing`);
	for (const [id, node] of Object.entries(conv.nodes)) {
		for (const choice of node.choices ?? []) {
			if (choice.next && !conv.nodes[choice.next]) problems.push(`${id}: choice "${choice.text}" -> missing node "${choice.next}"`);
		}
	}
	return problems;
}

/** Node ids reachable from the start: unreachable nodes are a sign of a typo in a link. */
export function reachableNodes(conv: Conversation): Set<string> {
	const seen = new Set<string>();
	const stack = [conv.start];
	while (stack.length > 0) {
		const id = stack.pop() as string;
		if (seen.has(id) || !conv.nodes[id]) continue;
		seen.add(id);
		for (const choice of conv.nodes[id].choices ?? []) if (choice.next) stack.push(choice.next);
	}
	return seen;
}
