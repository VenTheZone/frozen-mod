package com.v.frozen.entity;

import com.v.frozen.item.FrozenItems;
import com.v.frozen.winter.EternalWinter;
import java.util.List;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.ExperienceOrbEntity;
import net.minecraft.entity.ai.goal.EscapeDangerGoal;
import net.minecraft.entity.ai.goal.LookAtCustomerGoal;
import net.minecraft.entity.ai.goal.LookAtEntityGoal;
import net.minecraft.entity.ai.goal.StopAndLookAtEntityGoal;
import net.minecraft.entity.ai.goal.StopFollowingCustomerGoal;
import net.minecraft.entity.ai.goal.SwimGoal;
import net.minecraft.entity.ai.goal.WanderAroundFarGoal;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.passive.MerchantEntity;
import net.minecraft.entity.passive.PassiveEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.village.TradeOffer;
import net.minecraft.world.World;
import org.jetbrains.annotations.Nullable;

/** Shared base for the Arendelle royals: wander, look at players, never despawn, optionally trade. */
public abstract class FrozenMerchantEntity extends MerchantEntity {
	protected static final int MAX_USES = 999;

	protected FrozenMerchantEntity(EntityType<? extends MerchantEntity> type, World world) {
		super(type, world);
	}

	public static DefaultAttributeContainer.Builder createNpcAttributes() {
		return MobEntity.createMobAttributes()
			.add(EntityAttributes.GENERIC_MAX_HEALTH, 40.0)
			.add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.5);
	}

	protected abstract List<TradeOffer> createOffers();

	/** Whether an Act of True Love used on this character ends the Eternal Winter. */
	protected boolean acceptsTrueLove() {
		return false;
	}

	@Override
	protected void initGoals() {
		goalSelector.add(0, new SwimGoal(this));
		goalSelector.add(1, new StopFollowingCustomerGoal(this));
		goalSelector.add(1, new EscapeDangerGoal(this, 0.5));
		goalSelector.add(1, new LookAtCustomerGoal(this));
		goalSelector.add(8, new WanderAroundFarGoal(this, 0.35));
		goalSelector.add(9, new StopAndLookAtEntityGoal(this, PlayerEntity.class, 3.0f, 1.0f));
		goalSelector.add(10, new LookAtEntityGoal(this, MobEntity.class, 8.0f));
	}

	@Override
	public ActionResult interactMob(PlayerEntity player, Hand hand) {
		if (!isAlive() || hasCustomer()) {
			return super.interactMob(player, hand);
		}
		ItemStack stack = player.getStackInHand(hand);
		if (acceptsTrueLove() && stack.isOf(FrozenItems.TRUE_LOVE_HEART)) {
			return EternalWinter.useTrueLove(this, player, stack);
		}
		if (getOffers().isEmpty()) {
			return super.interactMob(player, hand);
		}
		if (!getWorld().isClient) {
			setCustomer(player);
			sendOffers(player, getDisplayName(), 1);
		}
		return ActionResult.success(getWorld().isClient);
	}

	@Override
	protected void fillRecipes() {
		getOffers().addAll(createOffers());
	}

	@Override
	protected void afterUsing(TradeOffer offer) {
		if (offer.shouldRewardPlayerExperience()) {
			getWorld().spawnEntity(new ExperienceOrbEntity(getWorld(), getX(), getY() + 0.5, getZ(), 3 + random.nextInt(4)));
		}
	}

	@Override
	public boolean cannotDespawn() {
		return true;
	}

	@Nullable
	@Override
	public PassiveEntity createChild(ServerWorld world, PassiveEntity entity) {
		return null;
	}
}
