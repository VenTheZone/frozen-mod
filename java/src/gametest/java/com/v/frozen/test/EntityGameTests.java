package com.v.frozen.test;

import com.v.frozen.entity.ElsaEntity;
import com.v.frozen.entity.FrozenEntities;
import com.v.frozen.entity.MarshmallowEntity;
import com.v.frozen.entity.OlafEntity;
import com.v.frozen.entity.SvenEntity;
import com.v.frozen.item.FrozenItems;
import java.util.List;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.passive.PigEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.Hand;
import net.minecraft.util.math.BlockPos;

public class EntityGameTests implements FabricGameTest {
	@GameTest(templateName = EMPTY_STRUCTURE)
	public void allCharactersSpawn(TestContext context) {
		List<EntityType<? extends MobEntity>> types = List.of(FrozenEntities.ELSA, FrozenEntities.ANNA, FrozenEntities.KRISTOFF,
			FrozenEntities.OLAF, FrozenEntities.SVEN, FrozenEntities.MARSHMALLOW);
		for (EntityType<? extends MobEntity> type : types) {
			MobEntity mob = context.spawnEntity(type, new BlockPos(2, 2, 2));
			context.assertTrue(mob.isAlive() && mob.getHealth() > 0, type.getUntranslatedName() + " should spawn alive");
		}
		context.complete();
	}

	@GameTest(templateName = EMPTY_STRUCTURE)
	public void olafTamesWithCarrots(TestContext context) {
		OlafEntity olaf = context.spawnEntity(FrozenEntities.OLAF, new BlockPos(2, 2, 2));
		PlayerEntity player = context.createMockSurvivalPlayer();
		player.setStackInHand(Hand.MAIN_HAND, new ItemStack(Items.CARROT, 64));
		for (int i = 0; i < 64 && !olaf.isTamed(); i++) {
			olaf.interactMob(player, Hand.MAIN_HAND);
		}
		context.assertTrue(olaf.isTamed() && player.getUuid().equals(olaf.getOwnerUuid()), "Olaf should be tamed by carrots");
		context.complete();
	}

	@GameTest(templateName = EMPTY_STRUCTURE)
	public void svenEatsCarrots(TestContext context) {
		SvenEntity sven = context.spawnEntity(FrozenEntities.SVEN, new BlockPos(2, 2, 2));
		PlayerEntity player = context.createMockSurvivalPlayer();
		player.setStackInHand(Hand.MAIN_HAND, new ItemStack(Items.CARROT, 4));
		int temper = sven.getTemper();
		sven.interactMob(player, Hand.MAIN_HAND);
		context.assertTrue(sven.getTemper() > temper, "carrot should raise Sven's temper");
		context.assertTrue(player.getMainHandStack().getCount() == 3, "carrot should be eaten");
		context.complete();
	}

	@GameTest(templateName = EMPTY_STRUCTURE)
	public void elsaSellsGlove(TestContext context) {
		ElsaEntity elsa = context.spawnEntity(FrozenEntities.ELSA, new BlockPos(2, 2, 2));
		boolean sellsGlove = elsa.getOffers().stream().anyMatch(o -> o.getSellItem().isOf(FrozenItems.ELSA_GLOVE));
		context.assertTrue(sellsGlove, "Elsa should trade the glove");
		context.complete();
	}

	@GameTest(templateName = EMPTY_STRUCTURE)
	public void elsaFightsBackWithIce(TestContext context) {
		ElsaEntity elsa = context.spawnEntity(FrozenEntities.ELSA, new BlockPos(1, 2, 1));
		PigEntity pig = context.spawnEntity(EntityType.PIG, new BlockPos(1, 2, 6));
		pig.setAiDisabled(true);
		elsa.attack(pig, 1.0f);
		context.waitAndRun(20, () -> {
			context.assertTrue(pig.getFrozenTicks() > 0, "Elsa's blast should freeze the pig");
			context.complete();
		});
	}

	@GameTest(templateName = EMPTY_STRUCTURE)
	public void marshmallowSlamFreezes(TestContext context) {
		MarshmallowEntity marshmallow = context.spawnEntity(FrozenEntities.MARSHMALLOW, new BlockPos(1, 2, 1));
		PigEntity pig = context.spawnEntity(EntityType.PIG, new BlockPos(3, 2, 1));
		marshmallow.tryAttack(pig);
		context.assertTrue(pig.getFrozenTicks() > 0, "slam should freeze");
		context.complete();
	}
}
