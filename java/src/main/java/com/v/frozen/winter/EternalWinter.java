package com.v.frozen.winter;

import java.util.List;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.minecraft.block.BlockState;
import net.minecraft.block.Blocks;
import net.minecraft.block.SnowBlock;
import net.minecraft.entity.boss.BossBar;
import net.minecraft.entity.boss.ServerBossBar;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.fluid.FluidState;
import net.minecraft.fluid.Fluids;
import net.minecraft.item.ItemStack;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Formatting;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.random.Random;
import net.minecraft.world.Heightmap;

/** Started by attacking Elsa, ended by giving Elsa or Anna an Act of True Love. Overworld only. */
public final class EternalWinter {
	public static final int EFFECT_INTERVAL = 20;
	public static final int RADIUS = 16;
	public static final int ATTEMPTS_PER_PLAYER = 12;
	public static final int MAX_SNOW_LAYERS = 3;
	private static final int WEATHER_TICKS = 6000;

	// ponytail: one static bar, fine for a single server per JVM (integrated or dedicated)
	private static final ServerBossBar BAR = new ServerBossBar(
		Text.translatable("event.frozen.eternal_winter"), BossBar.Color.BLUE, BossBar.Style.PROGRESS);

	private EternalWinter() {
	}

	public static void register() {
		ServerTickEvents.END_SERVER_TICK.register(EternalWinter::tick);
		ServerLifecycleEvents.SERVER_STOPPED.register(server -> BAR.clearPlayers());
	}

	public static boolean isActive(MinecraftServer server) {
		return EternalWinterState.get(server).isActive();
	}

	public static void start(MinecraftServer server) {
		EternalWinterState state = EternalWinterState.get(server);
		if (state.isActive()) {
			return;
		}
		state.setActive(true);
		server.getOverworld().setWeather(0, WEATHER_TICKS, true, false);
		broadcast(server, Text.translatable("event.frozen.eternal_winter.start").formatted(Formatting.AQUA));
	}

	public static void end(MinecraftServer server) {
		EternalWinterState state = EternalWinterState.get(server);
		if (!state.isActive()) {
			return;
		}
		state.setActive(false);
		BAR.clearPlayers();
		server.getOverworld().setWeather(WEATHER_TICKS, 0, false, false);
		broadcast(server, Text.translatable("event.frozen.eternal_winter.end").formatted(Formatting.GOLD));
	}

	/** Consumes the heart and ends the winter. Called when a player uses an Act of True Love on Elsa or Anna. */
	public static ActionResult useTrueLove(MobEntity target, PlayerEntity player, ItemStack heart) {
		if (!(target.getWorld() instanceof ServerWorld world)) {
			return ActionResult.SUCCESS;
		}
		if (!isActive(world.getServer())) {
			player.sendMessage(Text.translatable("event.frozen.eternal_winter.none"), true);
			return ActionResult.CONSUME;
		}
		if (!player.getAbilities().creativeMode) {
			heart.decrement(1);
		}
		target.setTarget(null);
		target.setAttacker(null);
		world.spawnParticles(ParticleTypes.HEART, target.getX(), target.getBodyY(0.8), target.getZ(), 12, 0.6, 0.6, 0.6, 0.1);
		world.playSound(null, target.getBlockPos(), SoundEvents.BLOCK_AMETHYST_BLOCK_RESONATE, SoundCategory.NEUTRAL, 1.0f, 1.0f);
		end(world.getServer());
		return ActionResult.CONSUME;
	}

	private static void tick(MinecraftServer server) {
		if (!isActive(server)) {
			return;
		}
		ServerWorld world = server.getOverworld();
		if (world.getTime() % EFFECT_INTERVAL != 0) {
			return;
		}
		if (!world.isRaining()) {
			world.setWeather(0, WEATHER_TICKS, true, false);
		}
		List<ServerPlayerEntity> players = world.getPlayers();
		for (ServerPlayerEntity player : List.copyOf(BAR.getPlayers())) {
			if (player.isRemoved() || player.getServerWorld() != world) {
				BAR.removePlayer(player);
			}
		}
		for (ServerPlayerEntity player : players) {
			BAR.addPlayer(player);
			freezeAround(world, player.getBlockPos(), RADIUS, ATTEMPTS_PER_PLAYER, world.random);
		}
	}

	/** Freezes still water and piles snow on random surface columns around {@code center}. */
	public static void freezeAround(ServerWorld world, BlockPos center, int radius, int attempts, Random random) {
		for (int i = 0; i < attempts; i++) {
			int x = center.getX() + random.nextInt(radius * 2 + 1) - radius;
			int z = center.getZ() + random.nextInt(radius * 2 + 1) - radius;
			BlockPos top = world.getTopPosition(Heightmap.Type.MOTION_BLOCKING, new BlockPos(x, 0, z));
			BlockPos surface = top.down();
			FluidState fluid = world.getFluidState(surface);
			if (fluid.isOf(Fluids.WATER) && fluid.isStill()) {
				world.setBlockState(surface, Blocks.ICE.getDefaultState());
				continue;
			}
			BlockPos pos = world.getBlockState(surface).isOf(Blocks.SNOW) ? surface : top;
			BlockState state = world.getBlockState(pos);
			BlockState snow = Blocks.SNOW.getDefaultState();
			if (state.isAir() && snow.canPlaceAt(world, pos)) {
				world.setBlockState(pos, snow);
			} else if (state.isOf(Blocks.SNOW) && state.get(SnowBlock.LAYERS) < MAX_SNOW_LAYERS) {
				world.setBlockState(pos, state.with(SnowBlock.LAYERS, state.get(SnowBlock.LAYERS) + 1));
			}
		}
	}

	private static void broadcast(MinecraftServer server, Text message) {
		server.getPlayerManager().broadcast(message, false);
	}
}
