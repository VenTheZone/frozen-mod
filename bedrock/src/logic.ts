// Pure game logic with no @minecraft/server imports, so it runs under `node --test`.

export interface Vec3 {
	x: number;
	y: number;
	z: number;
}

export type Facing = "north" | "south" | "east" | "west";

export const BRIDGE_LENGTH = 8;
export const STAIR_PITCH = 25;
export const SPIKE_RADIUS = 3;
export const SPIKE_POINTS = 16;
export const SPIKE_HEIGHT = 2;
export const MAX_SNOW_HEIGHT = 2; // snow_layer "height" state: 0 = one layer, so 2 = three layers

const STEP: Record<Facing, [number, number]> = {
	south: [0, 1],
	north: [0, -1],
	east: [1, 0],
	west: [-1, 0],
};

/** Bedrock yaw: 0 = south (+z), 90 = west, 180/-180 = north, -90 = east. */
export function facingFromYaw(yaw: number): Facing {
	const y = ((yaw % 360) + 360) % 360;
	if (y >= 315 || y < 45) return "south";
	if (y < 135) return "west";
	if (y < 225) return "north";
	return "east";
}

/** 3-wide path starting under the feet. Looking up builds rising stairs, looking down falling stairs. */
export function bridgePath(feet: Vec3, facing: Facing, pitch: number, length = BRIDGE_LENGTH): Vec3[] {
	const rise = pitch < -STAIR_PITCH ? 1 : pitch > STAIR_PITCH ? -1 : 0;
	const [dx, dz] = STEP[facing];
	const [sx, sz] = [-dz, dx];
	const base = { x: Math.floor(feet.x), y: Math.floor(feet.y) - 1, z: Math.floor(feet.z) };
	const path: Vec3[] = [];
	for (let i = 1; i <= length; i++) {
		const center = { x: base.x + dx * i, y: base.y + rise * i, z: base.z + dz * i };
		for (const side of [-1, 0, 1]) {
			path.push({ x: center.x + sx * side, y: center.y, z: center.z + sz * side });
		}
	}
	return path;
}

export function spikeRing(center: Vec3): Vec3[] {
	const seen = new Set<string>();
	const ring: Vec3[] = [];
	for (let i = 0; i < SPIKE_POINTS; i++) {
		const angle = (2 * Math.PI * i) / SPIKE_POINTS;
		const x = center.x + Math.round(Math.cos(angle) * SPIKE_RADIUS);
		const z = center.z + Math.round(Math.sin(angle) * SPIKE_RADIUS);
		for (let y = 0; y < SPIKE_HEIGHT; y++) {
			const key = `${x},${center.y + y},${z}`;
			if (!seen.has(key)) {
				seen.add(key);
				ring.push({ x, y: center.y + y, z });
			}
		}
	}
	return ring;
}

export interface SurfaceInfo {
	topTypeId: string;
	/** liquid_depth state of the top block; 0 means a still source block. */
	liquidDepth?: number;
	/** height state when the top block is a snow layer. */
	snowHeight?: number;
	topIsSolid: boolean;
	aboveIsAir: boolean;
}

export type SnowAction = "freeze" | "grow" | "place" | "none";

/** What the Eternal Winter does to one surface column. */
export function snowAction(s: SurfaceInfo): SnowAction {
	if (s.topTypeId === "minecraft:water") {
		return s.liquidDepth === 0 ? "freeze" : "none";
	}
	if (s.topTypeId === "minecraft:snow_layer") {
		return (s.snowHeight ?? 0) < MAX_SNOW_HEIGHT ? "grow" : "none";
	}
	return s.topIsSolid && s.aboveIsAir ? "place" : "none";
}

export interface Placed extends Vec3 {
	/** Tamed or named: never removed. */
	keep: boolean;
}

/**
 * Indices of characters to remove so that no two of the same kind stand within `radius`
 * of each other. Protected ones are always kept and win over unprotected neighbours.
 */
export function duplicatesToRemove(characters: Placed[], radius: number): number[] {
	const order = characters.map((_, i) => i).sort((a, b) => Number(characters[b].keep) - Number(characters[a].keep));
	const kept: Placed[] = [];
	const remove: number[] = [];
	for (const i of order) {
		const c = characters[i];
		const crowded = kept.some((k) => Math.hypot(k.x - c.x, k.y - c.y, k.z - c.z) < radius);
		if (crowded && !c.keep) {
			remove.push(i);
		} else {
			kept.push(c);
		}
	}
	return remove.sort((a, b) => a - b);
}

const ARROWS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];

/** Arrow pointing from the player toward a target, relative to where the player looks (Bedrock yaw: 0 = +z). */
export function bearingArrow(from: { x: number; z: number }, to: { x: number; z: number }, yaw: number): string {
	const targetYaw = (Math.atan2(-(to.x - from.x), to.z - from.z) * 180) / Math.PI;
	const relative = ((((targetYaw - yaw + 180) % 360) + 360) % 360) - 180;
	return ARROWS[(((Math.round(relative / 45) % 8) + 8) % 8)];
}

/** Items (and how many more of each) the player still needs for a trade. Empty means they can afford it. */
export function missingForTrade(have: Record<string, number>, wants: [string, number][]): [string, number][] {
	return wants.filter(([id, n]) => (have[id] ?? 0) < n).map(([id, n]) => [id, n - (have[id] ?? 0)]);
}

/** Per-player, per-ability cooldown gate keyed by game tick. */
export class Cooldowns {
	private readonly readyAt = new Map<string, number>();

	tryUse(key: string, now: number, cooldownTicks: number): boolean {
		const ready = this.readyAt.get(key) ?? 0;
		if (now < ready) return false;
		this.readyAt.set(key, now + cooldownTicks);
		return true;
	}
}
