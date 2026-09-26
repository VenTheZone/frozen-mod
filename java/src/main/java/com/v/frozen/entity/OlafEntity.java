package com.v.frozen.entity;

import net.minecraft.entity.EntityStatuses;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.ai.goal.FollowOwnerGoal;
import net.minecraft.entity.ai.goal.LookAroundGoal;
import net.minecraft.entity.ai.goal.LookAtEntityGoal;
import net.minecraft.entity.ai.goal.SitGoal;
import net.minecraft.entity.ai.goal.SwimGoal;
import net.minecraft.entity.ai.goal.TemptGoal;
import net.minecraft.entity.ai.goal.WanderAroundFarGoal;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.passive.PassiveEntity;
import net.minecraft.entity.passive.TameableEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.recipe.Ingredient;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundEvent;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.world.EntityView;
import net.minecraft.world.World;
import org.jetbrains.annotations.Nullable;

/** Likes warm hugs. Tamed with a carrot (his nose). Unlike snow golems, never melts. */
public class OlafEntity extends TameableEntity {
	public OlafEntity(EntityType<? extends TameableEntity> type, World world) {
		super(type, world);
	}

	public static DefaultAttributeContainer.Builder createOlafAttributes() {
		return MobEntity.createMobAttributes()
			.add(EntityAttributes.GENERIC_MAX_HEALTH, 20.0)
			.add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.3);
	}

	@Override
	protected void initGoals() {
		goalSelector.add(0, new SwimGoal(this));
		goalSelector.add(1, new SitGoal(this));
		goalSelector.add(2, new FollowOwnerGoal(this, 1.0, 8.0f, 2.0f, false));
		goalSelector.add(3, new TemptGoal(this, 1.0, Ingredient.ofItems(Items.CARROT), false));
		goalSelector.add(5, new WanderAroundFarGoal(this, 0.8));
		goalSelector.add(6, new LookAtEntityGoal(this, PlayerEntity.class, 8.0f));
		goalSelector.add(7, new LookAroundGoal(this));
	}

	@Override
	public ActionResult interactMob(PlayerEntity player, Hand hand) {
		ItemStack stack = player.getStackInHand(hand);
		if (!isTamed() && stack.isOf(Items.CARROT)) {
			if (!getWorld().isClient) {
				if (!player.getAbilities().creativeMode) {
					stack.decrement(1);
				}
				if (random.nextInt(3) == 0) {
					setOwner(player);
					navigation.stop();
					getWorld().sendEntityStatus(this, EntityStatuses.ADD_POSITIVE_PLAYER_REACTION_PARTICLES);
				} else {
					getWorld().sendEntityStatus(this, EntityStatuses.ADD_NEGATIVE_PLAYER_REACTION_PARTICLES);
				}
			}
			return ActionResult.success(getWorld().isClient);
		}
		if (isTamed() && isOwner(player) && hand == Hand.MAIN_HAND && stack.isEmpty()) {
			if (!getWorld().isClient) {
				setSitting(!isSitting());
				navigation.stop();
			}
			return ActionResult.success(getWorld().isClient);
		}
		return super.interactMob(player, hand);
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
		return SoundEvents.ENTITY_SNOW_GOLEM_AMBIENT;
	}

	@Override
	protected SoundEvent getHurtSound(DamageSource source) {
		return SoundEvents.ENTITY_SNOW_GOLEM_HURT;
	}

	@Override
	protected SoundEvent getDeathSound() {
		return SoundEvents.ENTITY_SNOW_GOLEM_DEATH;
	}
}
