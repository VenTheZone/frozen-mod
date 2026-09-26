package com.v.frozen.entity;

import com.v.frozen.item.FrozenItems;
import com.v.frozen.power.IceBlastEntity;
import com.v.frozen.winter.EternalWinter;
import java.util.List;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.ai.goal.ProjectileAttackGoal;
import net.minecraft.entity.ai.goal.RevengeGoal;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.entity.passive.MerchantEntity;
import net.minecraft.entity.ai.RangedAttackMob;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.sound.SoundEvents;
import net.minecraft.village.TradeOffer;
import net.minecraft.world.World;

public class ElsaEntity extends FrozenMerchantEntity implements RangedAttackMob {
	public ElsaEntity(EntityType<? extends MerchantEntity> type, World world) {
		super(type, world);
	}

	@Override
	protected void initGoals() {
		super.initGoals();
		goalSelector.add(2, new ProjectileAttackGoal(this, 0.5, 30, 12.0f));
		targetSelector.add(1, new RevengeGoal(this));
	}

	@Override
	protected List<TradeOffer> createOffers() {
		return List.of(
			new TradeOffer(new ItemStack(Items.EMERALD, 16), new ItemStack(Items.LEATHER), new ItemStack(FrozenItems.ELSA_GLOVE), MAX_USES, 10, 0.05f),
			new TradeOffer(new ItemStack(Items.EMERALD, 6), new ItemStack(FrozenItems.SNOWFLAKE_CRYSTAL), MAX_USES, 5, 0.05f),
			new TradeOffer(new ItemStack(Items.PACKED_ICE, 16), new ItemStack(Items.EMERALD), MAX_USES, 2, 0.05f)
		);
	}

	@Override
	public void attack(LivingEntity target, float pullProgress) {
		IceBlastEntity blast = new IceBlastEntity(getWorld(), this);
		double dx = target.getX() - getX();
		double dy = target.getBodyY(0.5) - blast.getY();
		double dz = target.getZ() - getZ();
		blast.setVelocity(dx, dy, dz, 1.6f, 2.0f);
		getWorld().spawnEntity(blast);
		playSound(SoundEvents.ENTITY_SNOWBALL_THROW, 1.0f, 1.6f);
	}

	@Override
	protected boolean acceptsTrueLove() {
		return true;
	}

	/** Frightening Elsa unleashes the Eternal Winter. */
	@Override
	public boolean damage(DamageSource source, float amount) {
		boolean hurt = super.damage(source, amount);
		if (hurt && source.getAttacker() instanceof PlayerEntity && getServer() != null) {
			EternalWinter.start(getServer());
		}
		return hurt;
	}

	@Override
	public boolean canFreeze() {
		return false;
	}
}
