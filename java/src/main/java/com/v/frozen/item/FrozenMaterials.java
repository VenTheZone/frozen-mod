package com.v.frozen.item;

import java.util.Map;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.ArmorMaterial;
import net.minecraft.item.ToolMaterial;
import net.minecraft.recipe.Ingredient;
import net.minecraft.sound.SoundEvent;
import net.minecraft.sound.SoundEvents;

public final class FrozenMaterials {
	private static final Map<ArmorItem.Type, Integer> BASE_DURABILITY = Map.of(
		ArmorItem.Type.HELMET, 11, ArmorItem.Type.CHESTPLATE, 16, ArmorItem.Type.LEGGINGS, 15, ArmorItem.Type.BOOTS, 13);
	private static final Map<ArmorItem.Type, Integer> PROTECTION = Map.of(
		ArmorItem.Type.HELMET, 2, ArmorItem.Type.CHESTPLATE, 6, ArmorItem.Type.LEGGINGS, 5, ArmorItem.Type.BOOTS, 2);

	/** Texture name maps to assets/minecraft/textures/models/armor/frozen_ice_layer_N.png. */
	public static final ArmorMaterial ICE_ARMOR = new ArmorMaterial() {
		@Override
		public int getDurability(ArmorItem.Type type) {
			return BASE_DURABILITY.get(type) * 20;
		}

		@Override
		public int getProtection(ArmorItem.Type type) {
			return PROTECTION.get(type);
		}

		@Override
		public int getEnchantability() {
			return 15;
		}

		@Override
		public SoundEvent getEquipSound() {
			return SoundEvents.BLOCK_GLASS_PLACE;
		}

		@Override
		public Ingredient getRepairIngredient() {
			return Ingredient.ofItems(FrozenItems.SNOWFLAKE_CRYSTAL);
		}

		@Override
		public String getName() {
			return "frozen_ice";
		}

		@Override
		public float getToughness() {
			return 1.0f;
		}

		@Override
		public float getKnockbackResistance() {
			return 0.0f;
		}
	};

	public static final ToolMaterial ICE_TOOL = new ToolMaterial() {
		@Override
		public int getDurability() {
			return 750;
		}

		@Override
		public float getMiningSpeedMultiplier() {
			return 7.0f;
		}

		@Override
		public float getAttackDamage() {
			return 2.5f;
		}

		@Override
		public int getMiningLevel() {
			return 2;
		}

		@Override
		public int getEnchantability() {
			return 15;
		}

		@Override
		public Ingredient getRepairIngredient() {
			return Ingredient.ofItems(FrozenItems.SNOWFLAKE_CRYSTAL);
		}
	};

	private FrozenMaterials() {
	}
}
