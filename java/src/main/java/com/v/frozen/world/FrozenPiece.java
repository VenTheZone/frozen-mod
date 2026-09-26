package com.v.frozen.world;

import net.minecraft.block.BlockState;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnReason;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.structure.StructureContext;
import net.minecraft.structure.StructurePiece;
import net.minecraft.structure.StructurePieceType;
import net.minecraft.util.math.BlockBox;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Direction;
import net.minecraft.world.StructureWorldAccess;

/** Procedural piece base: local-coordinate helpers that respect the piece's rotation and the current chunk. */
public abstract class FrozenPiece extends StructurePiece {
	protected FrozenPiece(StructurePieceType type, BlockPos origin, Direction facing, int width, int height, int depth) {
		super(type, 0, createBox(origin.getX(), origin.getY(), origin.getZ(), facing, width, height, depth));
		setOrientation(facing);
	}

	protected FrozenPiece(StructurePieceType type, NbtCompound nbt) {
		super(type, nbt);
	}

	@Override
	protected void writeNbt(StructureContext context, NbtCompound nbt) {
	}

	protected void fill(StructureWorldAccess world, BlockBox chunk, int x1, int y1, int z1, int x2, int y2, int z2, BlockState state) {
		fillWithOutline(world, chunk, x1, y1, z1, x2, y2, z2, state, state, false);
	}

	/** Hollow box: {@code shell} on the outside, {@code inside} everywhere else. */
	protected void room(StructureWorldAccess world, BlockBox chunk, int x1, int y1, int z1, int x2, int y2, int z2, BlockState shell, BlockState inside) {
		fillWithOutline(world, chunk, x1, y1, z1, x2, y2, z2, shell, inside, false);
	}

	/** Fills every column under local y=0 down to solid ground so the piece never floats. */
	protected void foundation(StructureWorldAccess world, BlockBox chunk, int x1, int z1, int x2, int z2, BlockState state) {
		for (int x = x1; x <= x2; x++) {
			for (int z = z1; z <= z2; z++) {
				fillDownwards(world, state, x, -1, z, chunk);
			}
		}
	}

	/** Each block position belongs to exactly one chunk, so this spawns the mob exactly once. */
	protected void spawn(StructureWorldAccess world, BlockBox chunk, EntityType<? extends MobEntity> type, int x, int y, int z) {
		BlockPos pos = offsetPos(x, y, z);
		if (!chunk.contains(pos)) {
			return;
		}
		MobEntity mob = type.create(world.toServerWorld());
		if (mob == null) {
			return;
		}
		mob.setPersistent();
		mob.refreshPositionAndAngles(pos.getX() + 0.5, pos.getY(), pos.getZ() + 0.5, 0.0f, 0.0f);
		mob.initialize(world, world.getLocalDifficulty(pos), SpawnReason.STRUCTURE, null, null);
		world.spawnEntityAndPassengers(mob);
	}
}
