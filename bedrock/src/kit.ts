import { Block, ItemStack, ItemTypes, Player } from "@minecraft/server";
import { give } from "./story.ts";

const KIT_KEY = "frozen:kit_given";
/** The starter chest placed beside each player on their first join. */
const CHEST_ITEMS: [string, number][] = [
	["minecraft:red_bed", 1],
	["minecraft:iron_sword", 1],
	["minecraft:shield", 1],
	["minecraft:iron_pickaxe", 1],
	["minecraft:iron_axe", 1],
	["minecraft:bow", 1],
	["minecraft:arrow", 32],
	["minecraft:bread", 16],
	["minecraft:cooked_beef", 8],
	["minecraft:torch", 32],
	["minecraft:crafting_table", 1],
	["minecraft:leather_helmet", 1],
	["minecraft:leather_chestplate", 1],
	["minecraft:leather_leggings", 1],
	["minecraft:leather_boots", 1],
	["minecraft:emerald", 8],
	["minecraft:carrot", 8],
	["frozen:elsa_glove", 1],
	["frozen:snowflake_crystal", 3],
];
const SPOTS = [[2, 0], [0, 2], [-2, 0], [0, -2], [2, 2], [-2, 2], [2, -2], [-2, -2], [3, 0], [0, 3]];

function chestSpot(player: Player): Block | undefined {
	const base = { x: Math.floor(player.location.x), y: Math.floor(player.location.y), z: Math.floor(player.location.z) };
	for (const [dx, dz] of SPOTS) {
		for (const dy of [0, 1, -1]) {
			try {
				const block = player.dimension.getBlock({ x: base.x + dx, y: base.y + dy, z: base.z + dz });
				const below = block?.below();
				if (block?.isAir && below && !below.isAir && !below.isLiquid) return block;
			} catch {
				// outside the world
			}
		}
	}
	return undefined;
}

/** Storybook in hand, everything else in a chest next to the player. Once per player. */
export function giveStarterKit(player: Player): void {
	if (player.getDynamicProperty(KIT_KEY)) return;
	player.setDynamicProperty(KIT_KEY, true);
	give(player, "frozen:storybook");
	const spot = chestSpot(player);
	const container = spot ? (spot.setType("minecraft:chest"), spot.getComponent("minecraft:inventory")?.container) : undefined;
	CHEST_ITEMS.forEach(([id, amount], slot) => {
		if (!ItemTypes.get(id)) return;
		if (container) container.setItem(slot, new ItemStack(id, amount));
		else give(player, id, amount);
	});
	player.sendMessage({ translate: container ? "frozen.kit.chest" : "frozen.kit.welcome" });
}
