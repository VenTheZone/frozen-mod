import {
	Block,
	BlockCustomComponent,
	Dimension,
	Direction,
	EntityDamageCause,
	EquipmentSlot,
	GameMode,
	ItemCustomComponent,
	Player,
	system,
} from "@minecraft/server";
import { bridgePath, Cooldowns, facingFromYaw, spikeRing, Vec3 } from "./logic.ts";

export const GLOVE = "frozen:elsa_glove";
const MAGIC_ICE = "frozen:magic_ice";
const ICE_BLAST = "frozen:ice_blast";
const COOLDOWN_TICKS = { blast: 10, bridge: 40, spikes: 100 };
const BLAST_SPEED = 2.0;
const SPIKE_RANGE = 5;
const REPLACEABLE = new Set([
	"minecraft:short_grass",
	"minecraft:tall_grass",
	"minecraft:fern",
	"minecraft:large_fern",
	"minecraft:snow_layer",
	"minecraft:deadbush",
]);

const cooldowns = new Cooldowns();

function placeIce(dimension: Dimension, positions: Vec3[]): number {
	let placed = 0;
	for (const pos of positions) {
		let block: Block | undefined;
		try {
			block = dimension.getBlock(pos);
		} catch {
			continue; // outside the world height
		}
		if (block && (block.isAir || block.isLiquid || REPLACEABLE.has(block.typeId))) {
			block.setType(MAGIC_ICE);
			placed++;
		}
	}
	return placed;
}

function fireBlast(player: Player): void {
	const head = player.getHeadLocation();
	const dir = player.getViewDirection();
	const blast = player.dimension.spawnEntity(ICE_BLAST, { x: head.x + dir.x, y: head.y + dir.y, z: head.z + dir.z });
	const projectile = blast.getComponent("minecraft:projectile");
	if (!projectile) {
		blast.remove();
		return;
	}
	projectile.owner = player;
	projectile.shoot({ x: dir.x * BLAST_SPEED, y: dir.y * BLAST_SPEED, z: dir.z * BLAST_SPEED });
	player.dimension.playSound("mob.snowgolem.shoot", head, { pitch: 1.6 });
}

function buildBridge(player: Player): void {
	const rotation = player.getRotation();
	placeIce(player.dimension, bridgePath(player.location, facingFromYaw(rotation.y), rotation.x));
	player.dimension.playSound("block.amethyst_block.chime", player.location);
}

function summonSpikes(player: Player, center: Vec3): void {
	const dimension = player.dimension;
	placeIce(dimension, spikeRing(center));
	for (const target of dimension.getEntities({ location: center, maxDistance: SPIKE_RANGE })) {
		if (target.id === player.id || !target.getComponent("minecraft:health")) continue;
		target.applyDamage(3, { cause: EntityDamageCause.entityAttack, damagingEntity: player });
		const dx = target.location.x - center.x;
		const dz = target.location.z - center.z;
		const len = Math.hypot(dx, dz) || 1;
		target.applyKnockback({ x: (dx / len) * 1.5, z: (dz / len) * 1.5 }, 0.4);
		target.addEffect("slowness", 100, { amplifier: 1 });
	}
	dimension.playSound("random.glass", center, { pitch: 0.6 });
}

/** Wears the glove down by one use and starts its visual cooldown. */
function spendGlove(player: Player): void {
	const equippable = player.getComponent("minecraft:equippable");
	const stack = equippable?.getEquipment(EquipmentSlot.Mainhand);
	if (!equippable || !stack || stack.typeId !== GLOVE) return;
	stack.getComponent("minecraft:cooldown")?.startCooldown(player);
	if (player.getGameMode() === GameMode.Creative) return;
	const durability = stack.getComponent("minecraft:durability");
	if (!durability) return;
	if (durability.damage + 1 >= durability.maxDurability) {
		equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
		player.playSound("random.break");
		return;
	}
	durability.damage += 1;
	equippable.setEquipment(EquipmentSlot.Mainhand, stack);
}

/** True when the player is aiming at the top of a nearby block, where onUseOn (spikes) handles the tap. */
function aimingAtGround(player: Player): boolean {
	const hit = player.getBlockFromViewDirection({ maxDistance: 6 });
	return hit?.face === Direction.Up;
}

export const gloveComponent: ItemCustomComponent = {
	onUse({ source: player }) {
		const now = system.currentTick;
		if (player.isSneaking) {
			if (aimingAtGround(player) || !cooldowns.tryUse(`${player.id}:bridge`, now, COOLDOWN_TICKS.bridge)) return;
			buildBridge(player);
		} else {
			if (!cooldowns.tryUse(`${player.id}:blast`, now, COOLDOWN_TICKS.blast)) return;
			fireBlast(player);
		}
		spendGlove(player);
	},
	onUseOn({ source, block, blockFace }) {
		if (!(source instanceof Player) || !source.isSneaking || blockFace !== Direction.Up) return;
		if (!cooldowns.tryUse(`${source.id}:spikes`, system.currentTick, COOLDOWN_TICKS.spikes)) return;
		summonSpikes(source, block.above()?.location ?? block.location);
		spendGlove(source);
	},
};

export const meltComponent: BlockCustomComponent = {
	onTick({ block }) {
		block.setType("minecraft:air");
		block.dimension.playSound("random.glass", block.center(), { volume: 0.4, pitch: 1.6 });
	},
};
