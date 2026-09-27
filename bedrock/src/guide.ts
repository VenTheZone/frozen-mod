import { Player, RawMessage, system, world } from "@minecraft/server";
import { bearingArrow } from "./logic.ts";
import { currentChapter, storyCastle } from "./story.ts";
import { CHAPTERS, horizontalDistance } from "./storyline.ts";
import { isWinterActive } from "./winter.ts";

const INTERVAL_TICKS = 20;

interface Target {
	label: RawMessage;
	x: number;
	z: number;
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
	if (guide[0] === "castle") {
		const castle = storyCastle() ?? scoreboardGoal(chapter);
		return castle && { label: { translate: "frozen.guide.castle" }, x: castle.x, z: castle.z };
	}
	let best: Target | undefined;
	let bestDistance = Infinity;
	for (const type of guide) {
		const [entity] = player.dimension.getEntities({ type, location: player.location, closest: 1 });
		const d = entity ? horizontalDistance(player.location, entity.location) : Infinity;
		if (entity && d < bestDistance) {
			best = { label: { translate: `entity.${type}.name` }, x: entity.location.x, z: entity.location.z };
			bestDistance = d;
		}
	}
	const fallback = scoreboardGoal(chapter);
	return best ?? (fallback && { label: { translate: `entity.${guide[0]}.name` }, ...fallback });
}

/** Action bar compass toward the current goal (plus the Eternal Winter banner while it lasts). */
function tickGuide(): void {
	const chapter = currentChapter();
	const winter = isWinterActive();
	for (const player of world.getDimension("overworld").getPlayers()) {
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
