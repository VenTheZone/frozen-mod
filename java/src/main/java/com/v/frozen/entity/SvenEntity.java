package com.v.frozen.entity;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.passive.AbstractHorseEntity;
import net.minecraft.entity.passive.PassiveEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundEvent;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.world.EntityView;
import net.minecraft.world.World;
import org.jetbrains.annotations.Nullable;

/** Reindeer are better than people. Tame by riding or feeding carrots, then saddle and ride. */
public class SvenEntity extends AbstractHorseEntity {
	public SvenEntity(EntityType<? extends AbstractHorseEntity> type, World world) {
		super(type, world);
	}

	public static DefaultAttributeContainer.Builder createSvenAttributes() {
		return createBaseHorseAttributes()
			.add(EntityAttributes.GENERIC_MAX_HEALTH, 30.0)
			.add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.3)
			.add(EntityAttributes.HORSE_JUMP_STRENGTH, 0.8);
	}

	@Override
	public ActionResult interactMob(PlayerEntity player, Hand hand) {
		ItemStack stack = player.getStackInHand(hand);
		boolean openingInventory = isTame() && player.shouldCancelInteraction();
		if (!hasPassengers() && !isBaby() && !openingInventory && stack.isOf(Items.CARROT)) {
			return interactHorse(player, stack);
		}
		return super.interactMob(player, hand);
	}

	/** Carrots count as apples: a little healing and a little temper toward taming. */
	@Override
	protected boolean receiveFood(PlayerEntity player, ItemStack item) {
		return super.receiveFood(player, item.isOf(Items.CARROT) ? new ItemStack(Items.APPLE) : item);
	}

	@Override
	public EntityView method_48926() {
		return getWorld();
	}

	@Override
	public boolean isBreedingItem(ItemStack stack) {
		return false;
	}

	@Override
	public boolean canFreeze() {
		return false;
	}

	@Nullable
	@Override
	public PassiveEntity createChild(ServerWorld world, PassiveEntity entity) {
		return null;
	}

	@Override
	protected SoundEvent getAmbientSound() {
		return SoundEvents.ENTITY_HORSE_AMBIENT;
	}

	@Override
	protected SoundEvent getHurtSound(DamageSource source) {
		return SoundEvents.ENTITY_HORSE_HURT;
	}

	@Override
	protected SoundEvent getDeathSound() {
		return SoundEvents.ENTITY_HORSE_DEATH;
	}

	@Override
	protected SoundEvent getAngrySound() {
		return SoundEvents.ENTITY_HORSE_ANGRY;
	}
}
