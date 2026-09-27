import { Player, RawMessage, system, world } from "@minecraft/server";
import { bearingArrow } from "./logic.ts";
import { currentChapter, storyCastle } from "./story.ts";
import { CHAPTERS, horizontalDistance } from "./storyline.ts";
import { isWinterActive } from "./winter.ts";

const INTERVAL_TICKS = 20;
/** How long a short notice keeps the action bar before the compass returns. */
const NOTICE_TICKS = 60;
const quietUntil = new Map<string, number>();

interface Target {
	label: RawMessage;
	x: number;
	z: number;
}

/** Shows a short notice in the action bar; the compass pauses so it isn't overwritten. */
export function notify(player: Player, message: RawMessage): void {
	quietUntil.set(player.id, system.currentTick + NOTICE_TICKS);
	player.onScreenDisplay.setActionBar(message);
}

/** Fixed story locations a world may publish (goal<chapter>_x / _z on the frozen_world scoreboard). */
function scoreboardGoal(chapter: number): { x: number; z: number } | undefined {
	const scores = world.scoreboard.getObjective("frozen_world");
	const x = scores?.getScore(`goal${chapter}_x`);
	const z = scores?.getScore(`goal${chapter}_z`);
	return x === undefined || z === undefined ? undefined : { x, z };
}

function findTarget(player: Player, chapter: number): Target | undefined {
	const guide = CHAPTERS[chapter]?.guide;
	if (!guide) return undefined;
	let best: Target | undefined;
	let bestDistance = Infinity;
	for (const type of guide.filter((g) => g !== "castle")) {
		const [entity] = player.dimension.getEntities({ type, location: player.location, closest: 1 });
		const d = entity ? horizontalDistance(player.location, entity.location) : Infinity;
		if (entity && d < bestDistance) {
			best = { label: { translate: `entity.${type}.name` }, x: entity.location.x, z: entity.location.z };
			bestDistance = d;
		}
	}
	if (best) return best;
	const castle = guide.includes("castle") ? storyCastle() : undefined;
	if (castle) return { label: { translate: "frozen.guide.castle" }, x: castle.x, z: castle.z };
	const fallback = scoreboardGoal(chapter);
	return fallback && { label: { translate: `entity.${guide[0]}.name` }, ...fallback };
}

/** Action bar compass toward the current goal (plus the Eternal Winter banner while it lasts). */
function tickGuide(): void {
	const chapter = currentChapter();
	const winter = isWinterActive();
	for (const player of world.getDimension("overworld").getPlayers()) {
		if (system.currentTick < (quietUntil.get(player.id) ?? 0)) continue;
		const parts: RawMessage[] = [];
		if (winter) parts.push({ translate: "frozen.winter.active" }, { text: "   " });
		const target = findTarget(player, chapter);
		if (target) {
			const distance = Math.round(horizontalDistance(player.location, target));
			const arrow = bearingArrow(player.location, target, player.getRotation().y);
			parts.push({ text: "§e" }, target.label, { text: ` · ${distance} m ${arrow}` });
		}
		if (parts.length > 0) player.onScreenDisplay.setActionBar({ rawtext: parts });
	}
}

export function registerGuide(): void {
	system.runInterval(tickGuide, INTERVAL_TICKS);
}
