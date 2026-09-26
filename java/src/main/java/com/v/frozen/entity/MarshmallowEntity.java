package com.v.frozen.entity;

import com.v.frozen.power.IceBlastEntity;
import net.minecraft.block.BlockState;
import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.ai.goal.ActiveTargetGoal;
import net.minecraft.entity.ai.goal.LookAroundGoal;
import net.minecraft.entity.ai.goal.LookAtEntityGoal;
import net.minecraft.entity.ai.goal.MeleeAttackGoal;
import net.minecraft.entity.ai.goal.RevengeGoal;
import net.minecraft.entity.ai.goal.WanderAroundFarGoal;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.boss.BossBar;
import net.minecraft.entity.boss.ServerBossBar;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.passive.IronGolemEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.sound.SoundEvent;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;
import org.jetbrains.annotations.Nullable;

/**
 * Elsa's snow guardian. Extends IronGolemEntity to reuse its model animations and launching slam,
 * but replaces all its goals so it is hostile to players.
 */
public class MarshmallowEntity extends IronGolemEntity {
	public static final int VOLLEY_INTERVAL = 80;
	public static final int SLAM_FREEZE_TICKS = 200;

	private final ServerBossBar bossBar = new ServerBossBar(getDisplayName(), BossBar.Color.WHITE, BossBar.Style.NOTCHED_10);
	private int volleyCooldown = VOLLEY_INTERVAL;

	public MarshmallowEntity(EntityType<? extends IronGolemEntity> type, World world) {
		super(type, world);
		experiencePoints = 50;
	}

	public static DefaultAttributeContainer.Builder createMarshmallowAttributes() {
		return MobEntity.createMobAttributes()
			.add(EntityAttributes.GENERIC_MAX_HEALTH, 200.0)
			.add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.3)
			.add(EntityAttributes.GENERIC_KNOCKBACK_RESISTANCE, 1.0)
			.add(EntityAttributes.GENERIC_ATTACK_DAMAGE, 12.0)
			.add(EntityAttributes.GENERIC_FOLLOW_RANGE, 32.0);
	}

	@Override
	protected void initGoals() {
		goalSelector.add(1, new MeleeAttackGoal(this, 1.0, true));
		goalSelector.add(7, new WanderAroundFarGoal(this, 0.6));
		goalSelector.add(8, new LookAtEntityGoal(this, PlayerEntity.class, 8.0f));
		goalSelector.add(9, new LookAroundGoal(this));
		targetSelector.add(1, new RevengeGoal(this));
		targetSelector.add(2, new ActiveTargetGoal<>(this, PlayerEntity.class, true));
	}

	@Override
	public boolean tryAttack(Entity target) {
		boolean hit = super.tryAttack(target);
		if (hit) {
			IceBlastEntity.freeze(target, SLAM_FREEZE_TICKS);
		}
		return hit;
	}

	@Override
	protected void mobTick() {
		super.mobTick();
		bossBar.setPercent(getHealth() / getMaxHealth());
		LivingEntity target = getTarget();
		if (target != null && --volleyCooldown <= 0 && squaredDistanceTo(target) > 16.0) {
			volley(target);
			volleyCooldown = VOLLEY_INTERVAL;
		}
	}

	private void volley(LivingEntity target) {
		for (int i = 0; i < 3; i++) {
			IceBlastEntity blast = new IceBlastEntity(getWorld(), this);
			double dx = target.getX() - getX();
			double dy = target.getBodyY(0.5) - blast.getY();
			double dz = target.getZ() - getZ();
			blast.setVelocity(dx, dy, dz, 1.4f, 8.0f);
			getWorld().spawnEntity(blast);
		}
		playSound(SoundEvents.ENTITY_SNOW_GOLEM_SHOOT, 2.0f, 0.5f);
	}

	@Override
	public void onStartedTrackingBy(ServerPlayerEntity player) {
		super.onStartedTrackingBy(player);
		bossBar.addPlayer(player);
	}

	@Override
	public void onStoppedTrackingBy(ServerPlayerEntity player) {
		super.onStoppedTrackingBy(player);
		bossBar.removePlayer(player);
	}

	@Override
	public void setCustomName(@Nullable Text name) {
		super.setCustomName(name);
		bossBar.setName(getDisplayName());
	}

	@Override
	protected ActionResult interactMob(PlayerEntity player, Hand hand) {
		return ActionResult.PASS;
	}

	@Override
	protected boolean isDisallowedInPeaceful() {
		return true;
	}

	@Override
	public boolean canFreeze() {
		return false;
	}

	@Override
	protected SoundEvent getHurtSound(DamageSource source) {
		return SoundEvents.ENTITY_SNOW_GOLEM_HURT;
	}

	@Override
	protected SoundEvent getDeathSound() {
		return SoundEvents.ENTITY_SNOW_GOLEM_DEATH;
	}

	@Override
	protected void playStepSound(BlockPos pos, BlockState state) {
		playSound(SoundEvents.BLOCK_SNOW_STEP, 1.5f, 0.6f);
	}
}
