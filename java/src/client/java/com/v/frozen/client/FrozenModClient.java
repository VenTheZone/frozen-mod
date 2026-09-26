package com.v.frozen.client;

import com.v.frozen.block.FrozenBlocks;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.blockrenderlayer.v1.BlockRenderLayerMap;
import net.minecraft.client.render.RenderLayer;

public class FrozenModClient implements ClientModInitializer {
	@Override
	public void onInitializeClient() {
		BlockRenderLayerMap.INSTANCE.putBlock(FrozenBlocks.MAGIC_ICE, RenderLayer.getTranslucent());
		FrozenRenderers.register();
	}
}
