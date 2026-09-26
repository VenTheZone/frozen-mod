package com.v.frozen.client;

import com.v.frozen.FrozenMod;
import com.v.frozen.entity.FrozenEntities;
import com.v.frozen.entity.MarshmallowEntity;
import com.v.frozen.entity.OlafEntity;
import com.v.frozen.entity.SvenEntity;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;
import net.minecraft.client.render.entity.AbstractHorseEntityRenderer;
import net.minecraft.client.render.entity.BipedEntityRenderer;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.FlyingItemEntityRenderer;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.model.EntityModelLayers;
import net.minecraft.client.render.entity.model.HorseEntityModel;
import net.minecraft.client.render.entity.model.IronGolemEntityModel;
import net.minecraft.client.render.entity.model.PlayerEntityModel;
import net.minecraft.client.render.entity.model.SnowGolemEntityModel;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.util.Identifier;

/** Every character reuses a vanilla model with a Frozen texture. */
final class FrozenRenderers {
	private FrozenRenderers() {
	}

	static void register() {
		EntityRendererRegistry.register(FrozenEntities.ICE_BLAST, FlyingItemEntityRenderer::new);
		EntityRendererRegistry.register(FrozenEntities.ELSA, ctx -> new Npc<>(ctx, "elsa", true));
		EntityRendererRegistry.register(FrozenEntities.ANNA, ctx -> new Npc<>(ctx, "anna", true));
		EntityRendererRegistry.register(FrozenEntities.KRISTOFF, ctx -> new Npc<>(ctx, "kristoff", false));
		EntityRendererRegistry.register(FrozenEntities.OLAF, Olaf::new);
		EntityRendererRegistry.register(FrozenEntities.SVEN, Sven::new);
		EntityRendererRegistry.register(FrozenEntities.MARSHMALLOW, Marshmallow::new);
	}

	private static Identifier texture(String name) {
		return FrozenMod.id("textures/entity/" + name + ".png");
	}

	static class Npc<T extends MobEntity> extends BipedEntityRenderer<T, PlayerEntityModel<T>> {
		private final Identifier texture;

		Npc(EntityRendererFactory.Context ctx, String name, boolean slim) {
			super(ctx, new PlayerEntityModel<>(ctx.getPart(slim ? EntityModelLayers.PLAYER_SLIM : EntityModelLayers.PLAYER), slim), 0.5f);
			this.texture = texture(name);
		}

		@Override
		public Identifier getTexture(T entity) {
			return texture;
		}
	}

	static class Olaf extends MobEntityRenderer<OlafEntity, SnowGolemEntityModel<OlafEntity>> {
		private static final Identifier TEXTURE = texture("olaf");

		Olaf(EntityRendererFactory.Context ctx) {
			super(ctx, new SnowGolemEntityModel<>(ctx.getPart(EntityModelLayers.SNOW_GOLEM)), 0.5f);
		}

		@Override
		public Identifier getTexture(OlafEntity entity) {
			return TEXTURE;
		}
	}

	static class Sven extends AbstractHorseEntityRenderer<SvenEntity, HorseEntityModel<SvenEntity>> {
		private static final Identifier TEXTURE = texture("sven");

		Sven(EntityRendererFactory.Context ctx) {
			super(ctx, new HorseEntityModel<>(ctx.getPart(EntityModelLayers.HORSE)), 1.1f);
		}

		@Override
		public Identifier getTexture(SvenEntity entity) {
			return TEXTURE;
		}
	}

	static class Marshmallow extends MobEntityRenderer<MarshmallowEntity, IronGolemEntityModel<MarshmallowEntity>> {
		private static final Identifier TEXTURE = texture("marshmallow");
		private static final float SCALE = 1.5f;

		Marshmallow(EntityRendererFactory.Context ctx) {
			super(ctx, new IronGolemEntityModel<>(ctx.getPart(EntityModelLayers.IRON_GOLEM)), 1.1f);
		}

		@Override
		protected void scale(MarshmallowEntity entity, MatrixStack matrices, float amount) {
			matrices.scale(SCALE, SCALE, SCALE);
		}

		@Override
		public Identifier getTexture(MarshmallowEntity entity) {
			return TEXTURE;
		}
	}
}
