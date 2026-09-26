package com.v.frozen.world;

import com.v.frozen.FrozenMod;
import com.v.frozen.entity.FrozenEntities;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.Blocks;
import net.minecraft.block.DoorBlock;
import net.minecraft.block.enums.DoubleBlockHalf;
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
 * The kingdom of Arendelle. Local layout (x, z in 0..32):
 * a stone plaza with a fountain in the middle, four colourful houses on the sides,
 * and the castle with green tower roofs at the north end.
 */
public class ArendellePiece extends FrozenPiece {
	public static final int WIDTH = 33;
	public static final int HEIGHT = 16;
	public static final int DEPTH = 33;
	public static final Identifier LOOT = FrozenMod.id("chests/arendelle");

	private static final BlockState AIR = Blocks.AIR.getDefaultState();
	private static final BlockState BRICKS = Blocks.STONE_BRICKS.getDefaultState();
	private static final BlockState COBBLE = Blocks.COBBLESTONE.getDefaultState();
	private static final BlockState PLANKS = Blocks.SPRUCE_PLANKS.getDefaultState();
	private static final BlockState LOG = Blocks.SPRUCE_LOG.getDefaultState();
	private static final BlockState ROOF = Blocks.DARK_OAK_PLANKS.getDefaultState();
	private static final BlockState TOWER_ROOF = Blocks.GREEN_TERRACOTTA.getDefaultState();
	private static final BlockState GLASS = Blocks.GLASS.getDefaultState();
	private static final BlockState LANTERN = Blocks.LANTERN.getDefaultState();

	public ArendellePiece(BlockPos origin, Direction facing) {
		super(FrozenStructures.ARENDELLE_PIECE, origin, facing, WIDTH, HEIGHT, DEPTH);
	}

	public ArendellePiece(NbtCompound nbt) {
		super(FrozenStructures.ARENDELLE_PIECE, nbt);
	}

	@Override
	public void generate(StructureWorldAccess world, StructureAccessor structures, ChunkGenerator generator, Random random,
						 BlockBox chunk, ChunkPos chunkPos, BlockPos pivot) {
		foundation(world, chunk, 0, 0, WIDTH - 1, DEPTH - 1, COBBLE);
		fill(world, chunk, 0, 1, 0, WIDTH - 1, HEIGHT - 1, DEPTH - 1, AIR);
		fill(world, chunk, 0, 0, 0, WIDTH - 1, 0, DEPTH - 1, Blocks.SNOW_BLOCK.getDefaultState());

		plaza(world, chunk);
		house(world, chunk, 2, 2, true, Blocks.YELLOW_TERRACOTTA);
		house(world, chunk, 2, 12, true, Blocks.LIGHT_BLUE_TERRACOTTA);
		house(world, chunk, 24, 2, false, Blocks.PINK_TERRACOTTA);
		house(world, chunk, 24, 12, false, Blocks.LIME_TERRACOTTA);
		castle(world, chunk, random);

		spawn(world, chunk, FrozenEntities.ANNA, 15, 1, 26);
		spawn(world, chunk, FrozenEntities.KRISTOFF, 18, 1, 26);
		spawn(world, chunk, FrozenEntities.SVEN, 20, 1, 17);
		spawn(world, chunk, FrozenEntities.OLAF, 13, 1, 15);
	}

	private void plaza(StructureWorldAccess world, BlockBox chunk) {
		fill(world, chunk, 11, 0, 4, 21, 0, 18, BRICKS);
		fill(world, chunk, 15, 0, 19, 17, 0, 20, BRICKS);
		fill(world, chunk, 9, 0, 5, 10, 0, 5, COBBLE);
		fill(world, chunk, 9, 0, 15, 10, 0, 15, COBBLE);
		fill(world, chunk, 22, 0, 5, 23, 0, 5, COBBLE);
		fill(world, chunk, 22, 0, 15, 23, 0, 15, COBBLE);
		// fountain
		fill(world, chunk, 14, 1, 9, 18, 1, 13, BRICKS);
		fill(world, chunk, 15, 1, 10, 17, 1, 12, Blocks.WATER.getDefaultState());
		fill(world, chunk, 16, 1, 11, 16, 3, 11, BRICKS);
		addBlock(world, LANTERN, 16, 4, 11, chunk);
	}

	private void house(StructureWorldAccess world, BlockBox chunk, int x0, int z0, boolean doorEast, Block walls) {
		int x1 = x0 + 6;
		int z1 = z0 + 6;
		room(world, chunk, x0, 0, z0, x1, 5, z1, walls.getDefaultState(), AIR);
		fill(world, chunk, x0, 0, z0, x1, 0, z1, PLANKS);
		for (int[] c : new int[][]{{x0, z0}, {x1, z0}, {x0, z1}, {x1, z1}}) {
			fill(world, chunk, c[0], 1, c[1], c[0], 5, c[1], LOG);
		}
		for (int i = 0; i <= 4; i++) {
			fill(world, chunk, x0 - 1 + i, 6 + i, z0 - 1 + i, x1 + 1 - i, 6 + i, z1 + 1 - i, ROOF);
		}
		fill(world, chunk, x0 + 2, 2, z0, x0 + 4, 3, z0, GLASS);
		fill(world, chunk, x0 + 2, 2, z1, x0 + 4, 3, z1, GLASS);
		int doorX = doorEast ? x1 : x0;
		int windowX = doorEast ? x0 : x1;
		fill(world, chunk, windowX, 2, z0 + 2, windowX, 3, z0 + 4, GLASS);
		BlockState door = Blocks.SPRUCE_DOOR.getDefaultState().with(DoorBlock.FACING, doorEast ? Direction.EAST : Direction.WEST);
		addBlock(world, door.with(DoorBlock.HALF, DoubleBlockHalf.LOWER), doorX, 1, z0 + 3, chunk);
		addBlock(world, door.with(DoorBlock.HALF, DoubleBlockHalf.UPPER), doorX, 2, z0 + 3, chunk);
		addBlock(world, LANTERN, x0 + 1, 1, z0 + 1, chunk);
	}

	private void castle(StructureWorldAccess world, BlockBox chunk, Random random) {
		room(world, chunk, 10, 0, 21, 22, 9, 30, BRICKS, AIR);
		for (int x = 10; x <= 22; x += 2) {
			addBlock(world, BRICKS, x, 10, 21, chunk);
			addBlock(world, BRICKS, x, 10, 30, chunk);
		}
		for (int z = 21; z <= 30; z += 2) {
			addBlock(world, BRICKS, 10, 10, z, chunk);
			addBlock(world, BRICKS, 22, 10, z, chunk);
		}
		for (int[] c : new int[][]{{10, 21}, {22, 21}, {10, 30}, {22, 30}}) {
			fill(world, chunk, c[0] - 1, 0, c[1] - 1, c[0] + 1, 12, c[1] + 1, BRICKS);
			fill(world, chunk, c[0] - 1, 13, c[1] - 1, c[0] + 1, 13, c[1] + 1, TOWER_ROOF);
			addBlock(world, TOWER_ROOF, c[0], 14, c[1], chunk);
		}
		fill(world, chunk, 15, 1, 21, 17, 4, 21, AIR);
		for (int z : new int[]{24, 27}) {
			fill(world, chunk, 10, 4, z, 10, 6, z, GLASS);
			fill(world, chunk, 22, 4, z, 22, 6, z, GLASS);
		}
		for (int x : new int[]{13, 16, 19}) {
			fill(world, chunk, x, 4, 30, x, 6, 30, GLASS);
		}
		fill(world, chunk, 16, 1, 22, 16, 1, 29, Blocks.RED_CARPET.getDefaultState());
		for (int[] l : new int[][]{{12, 23}, {20, 23}, {12, 28}, {20, 28}}) {
			addBlock(world, LANTERN, l[0], 1, l[1], chunk);
		}
		addChest(world, chunk, random, 14, 1, 29, LOOT);
	}
}
