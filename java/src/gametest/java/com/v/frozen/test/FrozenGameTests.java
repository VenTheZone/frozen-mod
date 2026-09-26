package com.v.frozen.test;

import com.v.frozen.block.FrozenBlocks;
import com.v.frozen.block.MagicIceBlock;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.block.Blocks;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.math.BlockPos;

public class FrozenGameTests implements FabricGameTest {
	@GameTest(templateName = EMPTY_STRUCTURE, tickLimit = 500)
	public void magicIceMelts(TestContext context) {
		BlockPos pos = new BlockPos(1, 2, 1);
		context.setBlockState(pos, FrozenBlocks.MAGIC_ICE);
		context.expectBlock(FrozenBlocks.MAGIC_ICE, pos);
		context.waitAndRun(MagicIceBlock.MIN_MELT_TICKS * 2 + 1, () -> {
			context.expectBlock(Blocks.AIR, pos);
			context.complete();
		});
	}
}
