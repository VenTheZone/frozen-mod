import { Block, BlockCustomComponent, Dimension, Vector3, world } from "@minecraft/server";

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

/** Places a pack structure, falling back to the /structure command if the script API refuses. Throws on failure. */
export function placeStructure(name: string, dimension: Dimension, origin: Vector3): void {
	try {
		world.structureManager.place(name, dimension, origin);
	} catch (apiError) {
		const result = dimension.runCommand(`structure load ${name} ${origin.x} ${origin.y} ${origin.z}`);
		if (result.successCount === 0) throw apiError;
	}
}

/** Spawns every marker inside a structure the script just placed, without waiting for block ticks. */
export function spawnMarkersIn(dimension: Dimension, origin: Vector3, size: Vector3): void {
	for (let x = 0; x < size.x; x++) {
		for (let y = 0; y < size.y; y++) {
			for (let z = 0; z < size.z; z++) {
				try {
					const block = dimension.getBlock({ x: origin.x + x, y: origin.y + y, z: origin.z + z });
					if (block?.typeId === MARKER) spawnFromMarker(block);
				} catch {
					// outside the world height
				}
			}
		}
	}
}

// Structure placement may not fire every hook on every version, so all three spawn the character.
export const spawnMarkerComponent: BlockCustomComponent = {
	onPlace: ({ block }) => spawnFromMarker(block),
	onTick: ({ block }) => spawnFromMarker(block),
	onRandomTick: ({ block }) => spawnFromMarker(block),
};
