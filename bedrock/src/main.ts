import { system } from "@minecraft/server";
import { gloveComponent, meltComponent } from "./powers.ts";
import { spawnMarkerComponent } from "./spawns.ts";
import { registerWinter } from "./winter.ts";

system.beforeEvents.startup.subscribe(({ itemComponentRegistry, blockComponentRegistry }) => {
	itemComponentRegistry.registerCustomComponent("frozen:glove", gloveComponent);
	blockComponentRegistry.registerCustomComponent("frozen:melt", meltComponent);
	blockComponentRegistry.registerCustomComponent("frozen:spawn_marker", spawnMarkerComponent);
});

registerWinter();
