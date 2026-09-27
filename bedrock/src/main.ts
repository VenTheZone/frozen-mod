import { system } from "@minecraft/server";
import { registerCleanup } from "./cleanup.ts";
import { registerDialogue } from "./dialogue.ts";
import { registerGuide } from "./guide.ts";
import { gloveComponent, meltComponent } from "./powers.ts";
import { registerSetup, storybookComponent } from "./setup.ts";
import { spawnMarkerComponent } from "./spawns.ts";
import { registerStory } from "./story.ts";
import { registerWinter } from "./winter.ts";

system.beforeEvents.startup.subscribe(({ itemComponentRegistry, blockComponentRegistry }) => {
	itemComponentRegistry.registerCustomComponent("frozen:glove", gloveComponent);
	itemComponentRegistry.registerCustomComponent("frozen:storybook", storybookComponent);
	blockComponentRegistry.registerCustomComponent("frozen:melt", meltComponent);
	blockComponentRegistry.registerCustomComponent("frozen:spawn_marker", spawnMarkerComponent);
});

registerCleanup();
registerDialogue();
registerGuide();
registerWinter();
registerStory();
registerSetup();
