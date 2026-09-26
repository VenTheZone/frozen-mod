package com.v.frozen.block;

import net.minecraft.block.BlockState;
import net.minecraft.block.TransparentBlock;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.random.Random;
import net.minecraft.world.World;

/** Ice conjured by Elsa's powers. Melts away on its own a few seconds after it appears. */
public class MagicIceBlock extends TransparentBlock {
	public static final int MIN_MELT_TICKS = 200;

	public MagicIceBlock(Settings settings) {
		super(settings);
	}

	@Override
	public void onBlockAdded(BlockState state, World world, BlockPos pos, BlockState oldState, boolean notify) {
		super.onBlockAdded(state, world, pos, oldState, notify);
		world.scheduleBlockTick(pos, this, MIN_MELT_TICKS + world.random.nextInt(MIN_MELT_TICKS));
	}

	@Override
	public void scheduledTick(BlockState state, ServerWorld world, BlockPos pos, Random random) {
		world.removeBlock(pos, false);
		world.playSound(null, pos, SoundEvents.BLOCK_GLASS_BREAK, SoundCategory.BLOCKS, 0.4f, 1.6f);
	}
}
