package com.v.frozen.entity;

import com.v.frozen.FrozenMod;
import com.v.frozen.power.IceBlastEntity;
import net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry;
import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

public final class FrozenEntities {
	public static final EntityType<IceBlastEntity> ICE_BLAST = register("ice_blast",
		EntityType.Builder.<IceBlastEntity>create(IceBlastEntity::new, SpawnGroup.MISC)
			.setDimensions(0.25f, 0.25f).maxTrackingRange(4).trackingTickInterval(10));

	public static final EntityType<ElsaEntity> ELSA = register("elsa",
		EntityType.Builder.create(ElsaEntity::new, SpawnGroup.CREATURE).setDimensions(0.6f, 1.95f).maxTrackingRange(10));
	public static final EntityType<AnnaEntity> ANNA = register("anna",
		EntityType.Builder.create(AnnaEntity::new, SpawnGroup.CREATURE).setDimensions(0.6f, 1.95f).maxTrackingRange(10));
	public static final EntityType<KristoffEntity> KRISTOFF = register("kristoff",
		EntityType.Builder.create(KristoffEntity::new, SpawnGroup.CREATURE).setDimensions(0.6f, 1.95f).maxTrackingRange(10));
	public static final EntityType<OlafEntity> OLAF = register("olaf",
		EntityType.Builder.create(OlafEntity::new, SpawnGroup.CREATURE).setDimensions(0.7f, 1.9f).maxTrackingRange(10));
	public static final EntityType<SvenEntity> SVEN = register("sven",
		EntityType.Builder.create(SvenEntity::new, SpawnGroup.CREATURE).setDimensions(1.3964844f, 1.6f).maxTrackingRange(10));
	public static final EntityType<MarshmallowEntity> MARSHMALLOW = register("marshmallow",
		EntityType.Builder.create(MarshmallowEntity::new, SpawnGroup.MONSTER).setDimensions(2.1f, 4.0f).maxTrackingRange(10));

	private FrozenEntities() {
	}

	private static <T extends Entity> EntityType<T> register(String name, EntityType.Builder<T> builder) {
		return Registry.register(Registries.ENTITY_TYPE, FrozenMod.id(name), builder.build(name));
	}

	public static void init() {
		FabricDefaultAttributeRegistry.register(ELSA, FrozenMerchantEntity.createNpcAttributes());
		FabricDefaultAttributeRegistry.register(ANNA, FrozenMerchantEntity.createNpcAttributes());
		FabricDefaultAttributeRegistry.register(KRISTOFF, FrozenMerchantEntity.createNpcAttributes());
		FabricDefaultAttributeRegistry.register(OLAF, OlafEntity.createOlafAttributes());
		FabricDefaultAttributeRegistry.register(SVEN, SvenEntity.createSvenAttributes());
		FabricDefaultAttributeRegistry.register(MARSHMALLOW, MarshmallowEntity.createMarshmallowAttributes());
	}
}
