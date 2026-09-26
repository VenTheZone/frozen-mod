package com.v.frozen.power;

import com.v.frozen.entity.FrozenEntities;
import com.v.frozen.item.FrozenItems;
import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityStatuses;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.projectile.thrown.ThrownItemEntity;
import net.minecraft.item.Item;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.util.hit.EntityHitResult;
import net.minecraft.util.hit.HitResult;
import net.minecraft.world.World;

public class IceBlastEntity extends ThrownItemEntity {
	public static final float DAMAGE = 4.0f;
	public static final int FREEZE_TICKS = 300;

	public IceBlastEntity(EntityType<? extends IceBlastEntity> type, World world) {
		super(type, world);
	}

	public IceBlastEntity(World world, LivingEntity owner) {
		super(FrozenEntities.ICE_BLAST, owner, world);
	}

	@Override
	protected Item getDefaultItem() {
		return FrozenItems.SNOWFLAKE_CRYSTAL;
	}

	@Override
	protected float getGravity() {
		return 0.005f;
	}

	/** Powder-snow style freeze plus slowness. Shared by every ice attack in the mod. */
	public static void freeze(Entity target, int ticks) {
		target.setFrozenTicks(Math.max(target.getFrozenTicks(), ticks));
		if (target instanceof LivingEntity living) {
			living.addStatusEffect(new StatusEffectInstance(StatusEffects.SLOWNESS, ticks / 3, 1));
		}
	}

	@Override
	protected void onEntityHit(EntityHitResult hit) {
		super.onEntityHit(hit);
		Entity target = hit.getEntity();
		target.damage(getDamageSources().thrown(this, getOwner()), DAMAGE);
		freeze(target, FREEZE_TICKS);
	}

	@Override
	protected void onCollision(HitResult hit) {
		super.onCollision(hit);
		if (!getWorld().isClient) {
			getWorld().sendEntityStatus(this, EntityStatuses.PLAY_DEATH_SOUND_OR_ADD_PROJECTILE_HIT_PARTICLES);
			discard();
		}
	}

	@Override
	public void handleStatus(byte status) {
		if (status == EntityStatuses.PLAY_DEATH_SOUND_OR_ADD_PROJECTILE_HIT_PARTICLES) {
			for (int i = 0; i < 12; i++) {
				getWorld().addParticle(ParticleTypes.SNOWFLAKE, getX(), getY(), getZ(),
					random.nextGaussian() * 0.1, random.nextGaussian() * 0.1, random.nextGaussian() * 0.1);
			}
		}
	}
}
