package com.v.frozen.test;

import com.v.frozen.entity.FrozenEntities;
import com.v.frozen.world.ArendellePiece;
import com.v.frozen.world.FrozenPiece;
import com.v.frozen.world.IceCastlePiece;
import net.fabricmc.fabric.api.gametest.v1.FabricGameTest;
import net.minecraft.block.Block;
import net.minecraft.block.Blocks;
import net.minecraft.entity.EntityType;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.test.GameTest;
import net.minecraft.test.TestContext;
import net.minecraft.util.math.BlockBox;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Box;
import net.minecraft.util.math.ChunkPos;
import net.minecraft.util.math.Direction;

public class StructureGameTests implements FabricGameTest {
	private static BlockPos origin(TestContext context) {
		return context.getAbsolutePos(new BlockPos(0, 1, 0));
	}

	private static void build(TestContext context, FrozenPiece piece) {
		ServerWorld world = context.getWorld();
		BlockBox box = piece.getBoundingBox();
		piece.generate(world, world.getStructureAccessor(), world.getChunkManager().getChunkGenerator(), world.getRandom(),
			box, new ChunkPos(box.getCenter()), box.getCenter());
	}

	private static void expect(TestContext context, BlockPos origin, Block block, int x, int y, int z) {
		Block actual = context.getWorld().getBlockState(origin.add(x, y, z)).getBlock();
		context.assertTrue(actual == block, "expected " + block + " at " + x + "," + y + "," + z + " but found " + actual);
	}

	private static void expectSpawned(TestContext context, BlockPos origin, EntityType<?> type, int x, int y, int z) {
		Box around = new Box(origin.add(x, y, z)).expand(1.0);
		int count = context.getWorld().getEntitiesByType(type, around, e -> true).size();
		context.assertTrue(count == 1, "expected one " + type.getUntranslatedName() + " at " + x + "," + y + "," + z + ", found " + count);
	}

	@GameTest(templateName = EMPTY_STRUCTURE, batchId = "ice_castle")
	public void iceCastleGenerates(TestContext context) {
		BlockPos origin = origin(context);
		build(context, new IceCastlePiece(origin, Direction.SOUTH));
		expect(context, origin, Blocks.SEA_LANTERN, 8, 33, 8);
		expect(context, origin, Blocks.SEA_LANTERN, 8, 0, 8);
		expect(context, origin, Blocks.PACKED_ICE, 2, 5, 3);
		expect(context, origin, Blocks.QUARTZ_STAIRS, 3, 5, 7);
		expect(context, origin, Blocks.AIR, 8, 2, 2);
		expect(context, origin, Blocks.CHEST, 8, 12, 11);
		expectSpawned(context, origin, FrozenEntities.ELSA, 8, 12, 8);
		expectSpawned(context, origin, FrozenEntities.MARSHMALLOW, 8, 1, 0);
		context.complete();
	}

	@GameTest(templateName = EMPTY_STRUCTURE, batchId = "arendelle")
	public void arendelleGenerates(TestContext context) {
		BlockPos origin = origin(context);
		build(context, new ArendellePiece(origin, Direction.SOUTH));
		expect(context, origin, Blocks.LANTERN, 16, 4, 11);
		expect(context, origin, Blocks.WATER, 15, 1, 10);
		expect(context, origin, Blocks.SPRUCE_DOOR, 8, 1, 5);
		expect(context, origin, Blocks.GREEN_TERRACOTTA, 10, 14, 21);
		expect(context, origin, Blocks.CHEST, 14, 1, 29);
		expectSpawned(context, origin, FrozenEntities.ANNA, 15, 1, 26);
		expectSpawned(context, origin, FrozenEntities.KRISTOFF, 18, 1, 26);
		expectSpawned(context, origin, FrozenEntities.SVEN, 20, 1, 17);
		expectSpawned(context, origin, FrozenEntities.OLAF, 13, 1, 15);
		context.complete();
	}
}
