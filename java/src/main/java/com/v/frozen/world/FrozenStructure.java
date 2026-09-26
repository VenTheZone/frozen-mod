package com.v.frozen.world;

import com.mojang.serialization.Codec;
import java.util.Optional;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.ChunkPos;
import net.minecraft.util.math.Direction;
import net.minecraft.world.Heightmap;
import net.minecraft.world.gen.structure.Structure;
import net.minecraft.world.gen.structure.StructureType;

/** A single-piece surface structure. The layout decides which piece is built. */
public class FrozenStructure extends Structure {
	public enum Layout {
		ICE_CASTLE, ARENDELLE
	}

	private final Layout layout;

	public FrozenStructure(Config config, Layout layout) {
		super(config);
		this.layout = layout;
	}

	public static Codec<FrozenStructure> codec(Layout layout) {
		return createCodec(config -> new FrozenStructure(config, layout));
	}

	@Override
	protected Optional<StructurePosition> getStructurePosition(Context context) {
		ChunkPos chunkPos = context.chunkPos();
		int x = chunkPos.getCenterX();
		int z = chunkPos.getCenterZ();
		int y = context.chunkGenerator().getHeightInGround(x, z, Heightmap.Type.WORLD_SURFACE_WG, context.world(), context.noiseConfig());
		BlockPos origin = new BlockPos(x, y, z);
		Direction facing = Direction.Type.HORIZONTAL.random(context.random());
		return Optional.of(new StructurePosition(origin, collector -> collector.addPiece(
			layout == Layout.ICE_CASTLE ? new IceCastlePiece(origin, facing) : new ArendellePiece(origin, facing))));
	}

	@Override
	public StructureType<?> getType() {
		return layout == Layout.ICE_CASTLE ? FrozenStructures.ICE_CASTLE : FrozenStructures.ARENDELLE;
	}
}
