package com.v.frozen.winter;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import net.minecraft.nbt.NbtCompound;
import org.junit.jupiter.api.Test;

class EternalWinterStateTest {
	@Test
	void defaultsToInactive() {
		assertFalse(new EternalWinterState().isActive());
		assertFalse(EternalWinterState.fromNbt(new NbtCompound()).isActive());
	}

	@Test
	void roundTripsThroughNbt() {
		EternalWinterState state = new EternalWinterState();
		state.setActive(true);
		assertTrue(state.isDirty());
		EternalWinterState loaded = EternalWinterState.fromNbt(state.writeNbt(new NbtCompound()));
		assertTrue(loaded.isActive());
	}

	@Test
	void settingSameValueDoesNotDirty() {
		EternalWinterState state = new EternalWinterState();
		state.setActive(false);
		assertFalse(state.isDirty());
	}
}
