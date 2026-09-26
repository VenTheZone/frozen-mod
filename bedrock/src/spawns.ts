import { Block, BlockCustomComponent } from "@minecraft/server";

export const MARKER = "frozen:spawn_marker";
export const CHARACTER_STATE = "frozen:character";

/** Replaces a structure's hidden marker block with the character it names. Runs at most once per marker. */
function spawnFromMarker(block: Block): void {
	if (block.typeId !== MARKER) return;
	const character = block.permutation.getState(CHARACTER_STATE as never) as string | undefined;
	const location = block.bottomCenter();
	block.setType("minecraft:air");
	if (character) {
		block.dimension.spawnEntity(`frozen:${character}`, location);
	}
}

// Structure placement may not fire every hook on every version, so all three spawn the character.
export const spawnMarkerComponent: BlockCustomComponent = {
	onPlace: ({ block }) => spawnFromMarker(block),
	onTick: ({ block }) => spawnFromMarker(block),
	onRandomTick: ({ block }) => spawnFromMarker(block),
};
