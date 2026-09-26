package com.v.frozen.entity;

import java.util.List;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.passive.MerchantEntity;
import net.minecraft.village.TradeOffer;
import net.minecraft.world.World;

public class AnnaEntity extends FrozenMerchantEntity {
	public AnnaEntity(EntityType<? extends MerchantEntity> type, World world) {
		super(type, world);
	}

	@Override
	protected List<TradeOffer> createOffers() {
		return List.of();
	}

	@Override
	protected boolean acceptsTrueLove() {
		return true;
	}
}
