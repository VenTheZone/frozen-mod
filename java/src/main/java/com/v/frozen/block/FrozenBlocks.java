package com.v.frozen.block;

import com.v.frozen.FrozenMod;
import net.minecraft.block.AbstractBlock;
import net.minecraft.block.Block;
import net.minecraft.block.MapColor;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.sound.BlockSoundGroup;

public final class FrozenBlocks {
	public static final Block MAGIC_ICE = register("magic_ice", new MagicIceBlock(
		AbstractBlock.Settings.create()
			.mapColor(MapColor.PALE_PURPLE)
			.slipperiness(0.98f)
			.strength(0.5f)
			.luminance(state -> 6)
			.sounds(BlockSoundGroup.GLASS)
			.nonOpaque()
			.dropsNothing()
			.allowsSpawning((state, world, pos, type) -> false)
			.solidBlock((state, world, pos) -> false)
			.suffocates((state, world, pos) -> false)
			.blockVision((state, world, pos) -> false)
	));

	private FrozenBlocks() {
	}

	private static Block register(String name, Block block) {
		return Registry.register(Registries.BLOCK, FrozenMod.id(name), block);
	}

	public static void init() {
	}
}
