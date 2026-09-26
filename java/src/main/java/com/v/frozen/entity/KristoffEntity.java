package com.v.frozen.entity;

import java.util.List;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.passive.MerchantEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.village.TradeOffer;
import net.minecraft.world.World;

/** Official Arendelle Ice Master and Deliverer. */
public class KristoffEntity extends FrozenMerchantEntity {
	public KristoffEntity(EntityType<? extends MerchantEntity> type, World world) {
		super(type, world);
	}

	@Override
	protected List<TradeOffer> createOffers() {
		return List.of(
			new TradeOffer(new ItemStack(Items.EMERALD), new ItemStack(Items.PACKED_ICE, 8), MAX_USES, 2, 0.05f),
			new TradeOffer(new ItemStack(Items.EMERALD, 3), new ItemStack(Items.BLUE_ICE, 4), MAX_USES, 3, 0.05f),
			new TradeOffer(new ItemStack(Items.CARROT, 12), new ItemStack(Items.EMERALD), MAX_USES, 2, 0.05f),
			new TradeOffer(new ItemStack(Items.EMERALD, 6), new ItemStack(Items.SADDLE), MAX_USES, 5, 0.05f)
		);
	}
}
