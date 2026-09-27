import { DisplaySlotId, system, world } from "@minecraft/server";
import { currentChapter } from "./story.ts";
import { CHAPTERS, isComplete } from "./storyline.ts";
import { isWinterActive } from "./winter.ts";

const OBJECTIVE = "frozen_story";
const INTERVAL_TICKS = 40;
let shown = "";

/** Lines for the always-visible sidebar, top line first. */
function trackerLines(): string[] {
	const chapter = currentChapter();
	const lines = isComplete(chapter)
		? ["§aThe End", "§fSummer is back!"]
		: [`§eChapter ${chapter + 1}/${CHAPTERS.length}`, `§f${CHAPTERS[chapter].tracker}`];
	if (isWinterActive()) lines.push("§b❄ Eternal Winter");
	return lines;
}

/** Keeps the sidebar quest tracker in sync; only rewrites it when the text changes, so it never flickers. */
function tickTracker(): void {
	const lines = trackerLines();
	const signature = lines.join("|");
	let objective = world.scoreboard.getObjective(OBJECTIVE);
	if (signature === shown && objective) return;
	if (!objective) objective = world.scoreboard.addObjective(OBJECTIVE, "§b❄ Frozen Story");
	for (const participant of objective.getParticipants()) objective.removeParticipant(participant);
	lines.forEach((line, i) => objective.setScore(line, lines.length - i));
	world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, { objective });
	shown = signature;
}

export function registerTracker(): void {
	system.runInterval(tickTracker, INTERVAL_TICKS);
}
