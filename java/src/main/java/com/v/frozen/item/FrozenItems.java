package com.v.frozen.item;

import com.v.frozen.FrozenMod;
import com.v.frozen.block.FrozenBlocks;
import com.v.frozen.entity.FrozenEntities;
import com.v.frozen.power.ElsaGloveItem;
import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.SpawnEggItem;
import net.minecraft.item.BlockItem;
import net.minecraft.item.Item;
import net.minecraft.item.ItemGroup;
import net.minecraft.item.ItemStack;
import net.minecraft.item.SwordItem;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.text.Text;
import net.minecraft.util.Rarity;

public final class FrozenItems {
	public static final Item SNOWFLAKE_CRYSTAL = register("snowflake_crystal", new Item(new Item.Settings().rarity(Rarity.UNCOMMON)));
	public static final Item MAGIC_ICE = register("magic_ice", new BlockItem(FrozenBlocks.MAGIC_ICE, new Item.Settings()));
	public static final Item TRUE_LOVE_HEART = register("true_love_heart", new Item(new Item.Settings().maxCount(16).rarity(Rarity.EPIC)));
	public static final Item ICE_SWORD = register("ice_sword", new SwordItem(FrozenMaterials.ICE_TOOL, 3, -2.4f, new Item.Settings()));
	public static final Item ELSA_GLOVE = register("elsa_glove", new ElsaGloveItem(new Item.Settings().maxDamage(250).rarity(Rarity.RARE)));
	public static final Item ICE_HELMET = armor("ice_helmet", ArmorItem.Type.HELMET);
	public static final Item ICE_CHESTPLATE = armor("ice_chestplate", ArmorItem.Type.CHESTPLATE);
	public static final Item ICE_LEGGINGS = armor("ice_leggings", ArmorItem.Type.LEGGINGS);
	public static final Item ICE_BOOTS = armor("ice_boots", ArmorItem.Type.BOOTS);

	public static final Item ELSA_SPAWN_EGG = spawnEgg("elsa", FrozenEntities.ELSA, 0xB4DCF5, 0xF0EBC8);
	public static final Item ANNA_SPAWN_EGG = spawnEgg("anna", FrozenEntities.ANNA, 0x283C6E, 0xB4286E);
	public static final Item KRISTOFF_SPAWN_EGG = spawnEgg("kristoff", FrozenEntities.KRISTOFF, 0x50505F, 0xDCBE6E);
	public static final Item OLAF_SPAWN_EGG = spawnEgg("olaf", FrozenEntities.OLAF, 0xF5F8FC, 0xF0821E);
	public static final Item SVEN_SPAWN_EGG = spawnEgg("sven", FrozenEntities.SVEN, 0x7D5A3C, 0xBEAA8C);
	public static final Item MARSHMALLOW_SPAWN_EGG = spawnEgg("marshmallow", FrozenEntities.MARSHMALLOW, 0xEBF5FC, 0x1E5AC8);

	public static final ItemGroup GROUP = Registry.register(Registries.ITEM_GROUP, FrozenMod.id("frozen"),
		FabricItemGroup.builder()
			.displayName(Text.translatable("itemGroup.frozen"))
			.icon(() -> new ItemStack(SNOWFLAKE_CRYSTAL))
			.entries((context, entries) -> {
				entries.add(ELSA_GLOVE);
				entries.add(SNOWFLAKE_CRYSTAL);
				entries.add(TRUE_LOVE_HEART);
				entries.add(MAGIC_ICE);
				entries.add(ICE_SWORD);
				entries.add(ICE_HELMET);
				entries.add(ICE_CHESTPLATE);
				entries.add(ICE_LEGGINGS);
				entries.add(ICE_BOOTS);
				entries.add(ELSA_SPAWN_EGG);
				entries.add(ANNA_SPAWN_EGG);
				entries.add(KRISTOFF_SPAWN_EGG);
				entries.add(OLAF_SPAWN_EGG);
				entries.add(SVEN_SPAWN_EGG);
				entries.add(MARSHMALLOW_SPAWN_EGG);
			})
			.build());

	private FrozenItems() {
	}

	private static Item armor(String name, ArmorItem.Type type) {
		return register(name, new ArmorItem(FrozenMaterials.ICE_ARMOR, type, new Item.Settings()));
	}

	private static Item spawnEgg(String name, EntityType<? extends MobEntity> type, int primary, int secondary) {
		return register(name + "_spawn_egg", new SpawnEggItem(type, primary, secondary, new Item.Settings()));
	}

	private static Item register(String name, Item item) {
		return Registry.register(Registries.ITEM, FrozenMod.id(name), item);
	}

	public static void init() {
	}
}
