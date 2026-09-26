package com.v.frozen.power;

import com.v.frozen.block.FrozenBlocks;
import java.util.ArrayList;
import java.util.List;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Box;
import net.minecraft.util.math.Direction;
import net.minecraft.world.World;

public final class IcePowers {
	public static final int BRIDGE_LENGTH = 8;
	public static final float STAIR_PITCH = 25.0f;
	public static final int SPIKE_RADIUS = 3;
	public static final int SPIKE_POINTS = 16;
	public static final int SPIKE_HEIGHT = 2;
	public static final double SPIKE_KNOCKBACK_RANGE = 5.0;

	private IcePowers() {
	}

	/** 3-wide path starting under the feet. Looking up builds stairs up, looking down builds stairs down. */
	public static List<BlockPos> bridgePath(BlockPos feet, Direction facing, float pitch, int length) {
		int rise = pitch < -STAIR_PITCH ? 1 : pitch > STAIR_PITCH ? -1 : 0;
		Direction side = facing.rotateYClockwise();
		BlockPos base = feet.down();
		List<BlockPos> path = new ArrayList<>(length * 3);
		for (int i = 1; i <= length; i++) {
			BlockPos center = base.offset(facing, i).up(rise * i);
			path.add(center.offset(side, -1));
			path.add(center);
			path.add(center.offset(side, 1));
		}
		return path;
	}

	public static List<BlockPos> spikeRing(BlockPos center) {
		List<BlockPos> ring = new ArrayList<>(SPIKE_POINTS * SPIKE_HEIGHT);
		for (int i = 0; i < SPIKE_POINTS; i++) {
			double angle = 2 * Math.PI * i / SPIKE_POINTS;
			BlockPos base = center.add((int) Math.round(Math.cos(angle) * SPIKE_RADIUS), 0, (int) Math.round(Math.sin(angle) * SPIKE_RADIUS));
			for (int y = 0; y < SPIKE_HEIGHT; y++) {
				BlockPos pos = base.up(y);
				if (!ring.contains(pos)) {
					ring.add(pos);
				}
			}
		}
		return ring;
	}

	public static void fireBlast(World world, PlayerEntity user) {
		IceBlastEntity blast = new IceBlastEntity(world, user);
		blast.setVelocity(user, user.getPitch(), user.getYaw(), 0.0f, 2.0f, 0.5f);
		world.spawnEntity(blast);
		world.playSound(null, user.getX(), user.getY(), user.getZ(), SoundEvents.ENTITY_SNOWBALL_THROW, SoundCategory.PLAYERS, 0.8f, 1.6f);
	}

	public static int buildBridge(ServerWorld world, PlayerEntity user) {
		int placed = placeAll(world, user, bridgePath(user.getBlockPos(), user.getHorizontalFacing(), user.getPitch(), BRIDGE_LENGTH));
		world.playSound(null, user.getBlockPos(), SoundEvents.BLOCK_AMETHYST_BLOCK_CHIME, SoundCategory.PLAYERS, 1.0f, 1.2f);
		return placed;
	}

	public static int summonSpikes(ServerWorld world, PlayerEntity user, BlockPos center) {
		int placed = placeAll(world, user, spikeRing(center));
		Box area = new Box(center).expand(SPIKE_KNOCKBACK_RANGE);
		for (LivingEntity target : world.getEntitiesByClass(LivingEntity.class, area, e -> e != user && e.isAlive())) {
			target.damage(world.getDamageSources().playerAttack(user), 3.0f);
			target.takeKnockback(1.5, center.getX() + 0.5 - target.getX(), center.getZ() + 0.5 - target.getZ());
			IceBlastEntity.freeze(target, IceBlastEntity.FREEZE_TICKS);
		}
		world.spawnParticles(ParticleTypes.SNOWFLAKE, center.getX() + 0.5, center.getY() + 0.5, center.getZ() + 0.5, 60, 2.0, 0.5, 2.0, 0.05);
		world.playSound(null, center, SoundEvents.BLOCK_GLASS_BREAK, SoundCategory.PLAYERS, 1.0f, 0.6f);
		return placed;
	}

	private static int placeAll(ServerWorld world, PlayerEntity user, List<BlockPos> positions) {
		int placed = 0;
		for (BlockPos pos : positions) {
			if (world.canPlayerModifyAt(user, pos) && world.getBlockState(pos).isReplaceable()
				&& world.setBlockState(pos, FrozenBlocks.MAGIC_ICE.getDefaultState())) {
				placed++;
			}
		}
		return placed;
	}
}
