package com.v.frozen;

import com.v.frozen.block.FrozenBlocks;
import com.v.frozen.entity.FrozenEntities;
import com.v.frozen.item.FrozenItems;
import com.v.frozen.winter.EternalWinter;
import com.v.frozen.world.FrozenStructures;
import net.fabricmc.api.ModInitializer;
import net.minecraft.util.Identifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FrozenMod implements ModInitializer {
	public static final String MOD_ID = "frozen";
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	public static Identifier id(String path) {
		return new Identifier(MOD_ID, path);
	}

	@Override
	public void onInitialize() {
		FrozenBlocks.init();
		FrozenEntities.init();
		FrozenItems.init();
		FrozenStructures.init();
		EternalWinter.register();
		LOGGER.info("The cold never bothered us anyway");
	}
}
