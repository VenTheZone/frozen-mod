package com.v.frozen.world;

import com.v.frozen.FrozenMod;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.structure.StructurePieceType;
import net.minecraft.world.gen.structure.StructureType;

public final class FrozenStructures {
	public static final StructurePieceType ICE_CASTLE_PIECE = Registry.register(Registries.STRUCTURE_PIECE,
		FrozenMod.id("ice_castle"), (StructurePieceType.Simple) IceCastlePiece::new);
	public static final StructurePieceType ARENDELLE_PIECE = Registry.register(Registries.STRUCTURE_PIECE,
		FrozenMod.id("arendelle"), (StructurePieceType.Simple) ArendellePiece::new);

	public static final StructureType<FrozenStructure> ICE_CASTLE = Registry.register(Registries.STRUCTURE_TYPE,
		FrozenMod.id("ice_castle"), () -> FrozenStructure.codec(FrozenStructure.Layout.ICE_CASTLE));
	public static final StructureType<FrozenStructure> ARENDELLE = Registry.register(Registries.STRUCTURE_TYPE,
		FrozenMod.id("arendelle"), () -> FrozenStructure.codec(FrozenStructure.Layout.ARENDELLE));

	private FrozenStructures() {
	}

	public static void init() {
	}
}
