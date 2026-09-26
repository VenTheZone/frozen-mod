package com.v.frozen.power;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashSet;
import java.util.List;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Direction;
import org.junit.jupiter.api.Test;

class IcePowersTest {
	private static final BlockPos FEET = new BlockPos(10, 64, 10);

	@Test
	void flatBridgeIsThreeWideAtFootLevelMinusOne() {
		List<BlockPos> path = IcePowers.bridgePath(FEET, Direction.SOUTH, 0, 8);
		assertEquals(24, path.size());
		assertTrue(path.stream().allMatch(p -> p.getY() == 63));
		assertTrue(path.contains(new BlockPos(9, 63, 11)));
		assertTrue(path.contains(new BlockPos(11, 63, 18)));
	}

	@Test
	void lookingUpBuildsRisingStairs() {
		List<BlockPos> path = IcePowers.bridgePath(FEET, Direction.EAST, -60, 4);
		assertTrue(path.contains(new BlockPos(11, 64, 10)));
		assertTrue(path.contains(new BlockPos(14, 67, 10)));
	}

	@Test
	void lookingDownBuildsFallingStairs() {
		List<BlockPos> path = IcePowers.bridgePath(FEET, Direction.NORTH, 60, 2);
		assertTrue(path.contains(new BlockPos(10, 62, 9)));
		assertTrue(path.contains(new BlockPos(10, 61, 8)));
	}

	@Test
	void spikeRingIsUniqueAndAtRadius() {
		List<BlockPos> ring = IcePowers.spikeRing(BlockPos.ORIGIN);
		assertEquals(ring.size(), new HashSet<>(ring).size());
		assertTrue(ring.contains(new BlockPos(3, 0, 0)));
		assertTrue(ring.contains(new BlockPos(0, 1, -3)));
		assertTrue(ring.stream().noneMatch(p -> p.getX() == 0 && p.getZ() == 0));
	}
}
