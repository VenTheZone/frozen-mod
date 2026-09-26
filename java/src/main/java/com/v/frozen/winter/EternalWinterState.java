package com.v.frozen.winter;

import net.minecraft.nbt.NbtCompound;
import net.minecraft.server.MinecraftServer;
import net.minecraft.world.PersistentState;

/** Saved in the overworld's data folder so the winter survives restarts. */
public class EternalWinterState extends PersistentState {
	public static final String KEY = "frozen_eternal_winter";
	private static final String ACTIVE = "Active";

	private boolean active;

	public boolean isActive() {
		return active;
	}

	public void setActive(boolean active) {
		if (this.active != active) {
			this.active = active;
			markDirty();
		}
	}

	@Override
	public NbtCompound writeNbt(NbtCompound nbt) {
		nbt.putBoolean(ACTIVE, active);
		return nbt;
	}

	public static EternalWinterState fromNbt(NbtCompound nbt) {
		EternalWinterState state = new EternalWinterState();
		state.active = nbt.getBoolean(ACTIVE);
		return state;
	}

	public static EternalWinterState get(MinecraftServer server) {
		return server.getOverworld().getPersistentStateManager().getOrCreate(EternalWinterState::fromNbt, EternalWinterState::new, KEY);
	}
}
