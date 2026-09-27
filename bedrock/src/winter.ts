import { Block, system, WeatherType, world } from "@minecraft/server";
import { snowAction } from "./logic.ts";

const ACTIVE_KEY = "frozen:eternal_winter";
const EFFECT_INTERVAL = 20;
const RADIUS = 16;
const ATTEMPTS_PER_PLAYER = 12;
const WEATHER_TICKS = 6000;
// ponytail: name heuristic for "can hold snow"; stable API has no Block.isSolid
const NOT_SOLID = /leaves|flower|grass|fern|torch|sapling|bush|vine|carpet|rail|button|sign|pane|fence|wall|door|lantern|ice|glass|slab|stairs|snow_layer/;

export function isWinterActive(): boolean {
	return world.getDynamicProperty(ACTIVE_KEY) === true;
}

export function startWinter(): void {
	if (isWinterActive()) return;
	world.setDynamicProperty(ACTIVE_KEY, true);
	world.getDimension("overworld").setWeather(WeatherType.Rain, WEATHER_TICKS);
	world.sendMessage({ translate: "frozen.winter.start" });
}

export function endWinter(): void {
	if (!isWinterActive()) return;
	world.setDynamicProperty(ACTIVE_KEY, false);
	world.getDimension("overworld").setWeather(WeatherType.Clear, WEATHER_TICKS);
	world.sendMessage({ translate: "frozen.winter.end" });
}

function freezeColumn(block: Block): void {
	const above = block.above();
	const action = snowAction({
		topTypeId: block.typeId,
		liquidDepth: block.isLiquid ? (block.permutation.getState("liquid_depth") as number | undefined) : undefined,
		snowHeight: block.typeId === "minecraft:snow_layer" ? (block.permutation.getState("height") as number | undefined) : undefined,
		topIsSolid: !block.isLiquid && !NOT_SOLID.test(block.typeId),
		aboveIsAir: above?.isAir ?? false,
	});
	if (action === "freeze") {
		block.setType("minecraft:ice");
	} else if (action === "grow") {
		const height = (block.permutation.getState("height") as number | undefined) ?? 0;
		block.setPermutation(block.permutation.withState("height", height + 1));
	} else if (action === "place") {
		above?.setType("minecraft:snow_layer");
	}
}

function tickWinter(): void {
	if (!isWinterActive()) return;
	const overworld = world.getDimension("overworld");
	if (system.currentTick % (EFFECT_INTERVAL * 60) === 0) {
		overworld.setWeather(WeatherType.Rain, WEATHER_TICKS);
	}
	for (const player of overworld.getPlayers()) {
		player.onScreenDisplay.setActionBar({ translate: "frozen.winter.active" });
		for (let i = 0; i < ATTEMPTS_PER_PLAYER; i++) {
			const x = Math.floor(player.location.x) + Math.floor(Math.random() * (RADIUS * 2 + 1)) - RADIUS;
			const z = Math.floor(player.location.z) + Math.floor(Math.random() * (RADIUS * 2 + 1)) - RADIUS;
			try {
				const top = overworld.getTopmostBlock({ x, z });
				if (top) freezeColumn(top);
			} catch {
				// column not loaded
			}
		}
	}
}

/** The winter starts in chapter 2, when Elsa flees (see story.ts). */
export function registerWinter(): void {
	system.runInterval(tickWinter, EFFECT_INTERVAL);
}
