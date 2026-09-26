package com.v.frozen.world;

import com.v.frozen.FrozenMod;
import com.v.frozen.entity.FrozenEntities;
import net.minecraft.block.BlockState;
import net.minecraft.block.Blocks;
import net.minecraft.block.StairsBlock;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.BlockBox;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.ChunkPos;
import net.minecraft.util.math.Direction;
import net.minecraft.util.math.random.Random;
import net.minecraft.world.StructureWorldAccess;
import net.minecraft.world.gen.StructureAccessor;
import net.minecraft.world.gen.chunk.ChunkGenerator;

/**
 * Elsa's castle. Local layout (x, z in 0..16):
 * main hall 2..14 (y 0..11) whose roof is a terrace, upper hall 4..12 (y 11..19) opening onto a
 * front balcony, a spire on top, four corner towers, and an interior staircase up the west wall.
 */
public class IceCastlePiece extends FrozenPiece {
	public static final int WIDTH = 17;
	public static final int HEIGHT = 34;
	public static final int DEPTH = 17;
	public static final Identifier LOOT = FrozenMod.id("chests/ice_castle");

	private static final BlockState AIR = Blocks.AIR.getDefaultState();
	private static final BlockState PACKED = Blocks.PACKED_ICE.getDefaultState();
	private static final BlockState BLUE = Blocks.BLUE_ICE.getDefaultState();
	private static final BlockState GLASS = Blocks.LIGHT_BLUE_STAINED_GLASS.getDefaultState();
	private static final BlockState LIGHT = Blocks.SEA_LANTERN.getDefaultState();
	private static final BlockState STAIRS = Blocks.QUARTZ_STAIRS.getDefaultState().with(StairsBlock.FACING, Direction.SOUTH);

	public IceCastlePiece(BlockPos origin, Direction facing) {
		super(FrozenStructures.ICE_CASTLE_PIECE, origin, facing, WIDTH, HEIGHT, DEPTH);
	}

	public IceCastlePiece(NbtCompound nbt) {
		super(FrozenStructures.ICE_CASTLE_PIECE, nbt);
	}

	@Override
	public void generate(StructureWorldAccess world, StructureAccessor structures, ChunkGenerator generator, Random random,
						 BlockBox chunk, ChunkPos chunkPos, BlockPos pivot) {
		foundation(world, chunk, 0, 0, WIDTH - 1, DEPTH - 1, PACKED);
		fill(world, chunk, 0, 1, 0, WIDTH - 1, HEIGHT - 1, DEPTH - 1, AIR);
		fill(world, chunk, 0, 0, 0, WIDTH - 1, 0, DEPTH - 1, PACKED);

		mainHall(world, chunk);
		upperHall(world, chunk, random);
		snowflakeFloor(world, chunk);
		for (int[] c : new int[][]{{1, 1}, {15, 1}, {1, 15}, {15, 15}}) {
			fill(world, chunk, c[0] - 1, 1, c[1] - 1, c[0] + 1, 16, c[1] + 1, PACKED);
			fill(world, chunk, c[0], 17, c[1], c[0], 20, c[1], BLUE);
		}
		fill(world, chunk, 7, 20, 7, 9, 27, 9, BLUE);
		fill(world, chunk, 8, 28, 8, 8, 32, 8, BLUE);
		addBlock(world, LIGHT, 8, 33, 8, chunk);

		spawn(world, chunk, FrozenEntities.ELSA, 8, 12, 8);
		spawn(world, chunk, FrozenEntities.MARSHMALLOW, 8, 1, 0);
	}

	private void mainHall(StructureWorldAccess world, BlockBox chunk) {
		room(world, chunk, 2, 0, 2, 14, 11, 14, PACKED, AIR);
		for (int k : new int[]{5, 8, 11}) {
			fill(world, chunk, 2, 3, k, 2, 6, k, GLASS);
			fill(world, chunk, 14, 3, k, 14, 6, k, GLASS);
			fill(world, chunk, k, 3, 14, k, 6, 14, GLASS);
		}
		fill(world, chunk, 5, 3, 2, 5, 6, 2, GLASS);
		fill(world, chunk, 11, 3, 2, 11, 6, 2, GLASS);
		fill(world, chunk, 7, 1, 2, 9, 4, 2, AIR);
		for (int k = 1; k <= 11; k++) {
			addBlock(world, STAIRS, 3, k, 2 + k, chunk);
		}
		fill(world, chunk, 3, 11, 9, 3, 11, 12, AIR);
		// terrace railing and front balcony
		for (int i = 2; i <= 14; i++) {
			addBlock(world, GLASS, i, 12, 14, chunk);
			addBlock(world, GLASS, 2, 12, i, chunk);
			addBlock(world, GLASS, 14, 12, i, chunk);
		}
		fill(world, chunk, 6, 11, 0, 10, 11, 1, PACKED);
		fill(world, chunk, 6, 12, 0, 10, 12, 0, GLASS);
		addBlock(world, GLASS, 6, 12, 1, chunk);
		addBlock(world, GLASS, 10, 12, 1, chunk);
	}

	private void upperHall(StructureWorldAccess world, BlockBox chunk, Random random) {
		room(world, chunk, 4, 11, 4, 12, 19, 12, PACKED, AIR);
		for (int k : new int[]{6, 10}) {
			fill(world, chunk, 4, 13, k, 4, 16, k, GLASS);
			fill(world, chunk, 12, 13, k, 12, 16, k, GLASS);
			fill(world, chunk, k, 13, 12, k, 16, 12, GLASS);
		}
		fill(world, chunk, 7, 12, 4, 9, 14, 4, AIR);
		addBlock(world, LIGHT, 8, 11, 8, chunk);
		addChest(world, chunk, random, 8, 12, 11, LOOT);
	}

	private void snowflakeFloor(StructureWorldAccess world, BlockBox chunk) {
		for (int i = 1; i < WIDTH - 1; i++) {
			addBlock(world, BLUE, i, 0, 8, chunk);
			addBlock(world, BLUE, 8, 0, i, chunk);
			addBlock(world, BLUE, i, 0, i, chunk);
			addBlock(world, BLUE, i, 0, WIDTH - 1 - i, chunk);
		}
		for (int[] l : new int[][]{{8, 8}, {4, 4}, {12, 4}, {4, 12}, {12, 12}}) {
			addBlock(world, LIGHT, l[0], 0, l[1], chunk);
		}
	}
}
