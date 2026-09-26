package com.v.frozen.test;

import com.v.frozen.entity.AnnaEntity;
import com.v.frozen.entity.ElsaEntity;
import com.v.frozen.entity.FrozenEntities;
import com.v.frozen.item.FrozenItems;
import com.v.frozen.winter.EternalWinter;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.block.Blocks;
import net.minecraft.block.SnowBlock;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.server.MinecraftServer;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.Hand;
import net.minecraft.util.math.BlockPos;

public class WinterGameTests implements FabricGameTest {
	@GameTest(templateName = EMPTY_STRUCTURE, batchId = "winter")
	public void attackingElsaStartsWinterAndTrueLoveEndsIt(TestContext context) {
		MinecraftServer server = context.getWorld().getServer();
		EternalWinter.end(server);
		ElsaEntity elsa = context.spawnEntity(FrozenEntities.ELSA, new BlockPos(2, 2, 2));
		AnnaEntity anna = context.spawnEntity(FrozenEntities.ANNA, new BlockPos(4, 2, 2));
		PlayerEntity player = context.createMockSurvivalPlayer();

		elsa.damage(context.getWorld().getDamageSources().playerAttack(player), 1.0f);
		context.assertTrue(EternalWinter.isActive(server), "attacking Elsa should start the winter");

		player.setStackInHand(Hand.MAIN_HAND, new ItemStack(FrozenItems.TRUE_LOVE_HEART, 2));
		anna.interactMob(player, Hand.MAIN_HAND);
		context.assertTrue(!EternalWinter.isActive(server), "true love should end the winter");
		context.assertTrue(player.getMainHandStack().getCount() == 1, "heart should be consumed");

		anna.interactMob(player, Hand.MAIN_HAND);
		context.assertTrue(player.getMainHandStack().getCount() == 1, "heart is kept when there is no winter");
		context.complete();
	}

	@GameTest(templateName = EMPTY_STRUCTURE, batchId = "winter")
	public void winterFreezesWaterAndPilesSnow(TestContext context) {
		BlockPos stone = new BlockPos(1, 1, 1);
		BlockPos water = new BlockPos(3, 1, 3);
		context.setBlockState(stone, Blocks.STONE);
		context.setBlockState(water.down(), Blocks.STONE);
		context.setBlockState(water, Blocks.WATER);

		EternalWinter.freezeAround(context.getWorld(), context.getAbsolutePos(water), 0, 1, context.getWorld().random);
		context.expectBlock(Blocks.ICE, water);

		for (int i = 0; i < 5; i++) {
			EternalWinter.freezeAround(context.getWorld(), context.getAbsolutePos(stone), 0, 1, context.getWorld().random);
		}
		context.expectBlock(Blocks.SNOW, stone.up());
		context.expectBlockProperty(stone.up(), SnowBlock.LAYERS, EternalWinter.MAX_SNOW_LAYERS);
		context.complete();
	}
}
