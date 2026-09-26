package com.v.frozen.test;

import com.v.frozen.block.FrozenBlocks;
import com.v.frozen.entity.FrozenEntities;
import com.v.frozen.power.IceBlastEntity;
import com.v.frozen.power.IcePowers;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.passive.PigEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Vec3d;

public class PowerGameTests implements FabricGameTest {
	private static PlayerEntity playerAt(TestContext context, BlockPos relative, float yaw, float pitch) {
		PlayerEntity player = context.createMockSurvivalPlayer();
		BlockPos abs = context.getAbsolutePos(relative);
		player.refreshPositionAndAngles(abs.getX() + 0.5, abs.getY(), abs.getZ() + 0.5, yaw, pitch);
		return player;
	}

	@GameTest(templateName = EMPTY_STRUCTURE)
	public void bridgePlacesMagicIce(TestContext context) {
		PlayerEntity player = playerAt(context, new BlockPos(2, 4, 0), 0.0f, 0.0f);
		int placed = IcePowers.buildBridge(context.getWorld(), player);
		context.assertTrue(placed == IcePowers.BRIDGE_LENGTH * 3, "expected full bridge, placed " + placed);
		context.expectBlock(FrozenBlocks.MAGIC_ICE, new BlockPos(2, 3, 1));
		context.expectBlock(FrozenBlocks.MAGIC_ICE, new BlockPos(3, 3, 8));
		context.complete();
	}

	@GameTest(templateName = EMPTY_STRUCTURE)
	public void spikesPlaceRingAndFreezeMobs(TestContext context) {
		BlockPos center = new BlockPos(4, 3, 4);
		PigEntity pig = context.spawnEntity(EntityType.PIG, center.east());
		pig.setAiDisabled(true);
		PlayerEntity player = playerAt(context, center, 0.0f, 90.0f);
		IcePowers.summonSpikes(context.getWorld(), player, context.getAbsolutePos(center));
		context.expectBlock(FrozenBlocks.MAGIC_ICE, center.east(3));
		context.expectBlock(FrozenBlocks.MAGIC_ICE, center.east(3).up());
		context.assertTrue(pig.getFrozenTicks() > 0, "pig should be frozen");
		context.complete();
	}

	@GameTest(templateName = EMPTY_STRUCTURE)
	public void iceBlastFreezesTarget(TestContext context) {
		PigEntity pig = context.spawnEntity(EntityType.PIG, new BlockPos(1, 2, 5));
		pig.setAiDisabled(true);
		IceBlastEntity blast = context.spawnEntity(FrozenEntities.ICE_BLAST, new Vec3d(1.5, 2.5, 1.5));
		blast.setVelocity(0.0, 0.0, 1.0);
		context.waitAndRun(20, () -> {
			context.assertTrue(pig.getFrozenTicks() > 0, "pig should be frozen");
			context.assertTrue(pig.hasStatusEffect(StatusEffects.SLOWNESS), "pig should be slowed");
			context.assertTrue(pig.getHealth() < pig.getMaxHealth(), "pig should be hurt");
			context.complete();
		});
	}
}
