package com.v.frozen.power;

import com.v.frozen.item.FrozenItems;
import java.util.List;
import net.minecraft.client.item.TooltipContext;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.ItemUsageContext;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.stat.Stats;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Formatting;
import net.minecraft.util.Hand;
import net.minecraft.util.TypedActionResult;
import net.minecraft.util.math.Direction;
import net.minecraft.world.World;
import org.jetbrains.annotations.Nullable;

public class ElsaGloveItem extends Item {
	public static final int BLAST_COOLDOWN = 10;
	public static final int BRIDGE_COOLDOWN = 40;
	public static final int SPIKES_COOLDOWN = 100;

	public ElsaGloveItem(Settings settings) {
		super(settings);
	}

	@Override
	public TypedActionResult<ItemStack> use(World world, PlayerEntity user, Hand hand) {
		ItemStack stack = user.getStackInHand(hand);
		if (world instanceof ServerWorld serverWorld) {
			if (user.isSneaking()) {
				IcePowers.buildBridge(serverWorld, user);
				spend(user, hand, stack, BRIDGE_COOLDOWN);
			} else {
				IcePowers.fireBlast(world, user);
				spend(user, hand, stack, BLAST_COOLDOWN);
			}
		}
		return TypedActionResult.success(stack, world.isClient());
	}

	@Override
	public ActionResult useOnBlock(ItemUsageContext context) {
		PlayerEntity player = context.getPlayer();
		if (player == null || !player.isSneaking() || context.getSide() != Direction.UP) {
			return ActionResult.PASS;
		}
		if (context.getWorld() instanceof ServerWorld serverWorld) {
			IcePowers.summonSpikes(serverWorld, player, context.getBlockPos().up());
			spend(player, context.getHand(), context.getStack(), SPIKES_COOLDOWN);
		}
		return ActionResult.success(context.getWorld().isClient());
	}

	private static void spend(PlayerEntity user, Hand hand, ItemStack stack, int cooldown) {
		user.getItemCooldownManager().set(stack.getItem(), cooldown);
		user.incrementStat(Stats.USED.getOrCreateStat(stack.getItem()));
		stack.damage(1, user, p -> p.sendToolBreakStatus(hand));
	}

	@Override
	public boolean canRepair(ItemStack stack, ItemStack ingredient) {
		return ingredient.isOf(FrozenItems.SNOWFLAKE_CRYSTAL);
	}

	@Override
	public void appendTooltip(ItemStack stack, @Nullable World world, List<Text> tooltip, TooltipContext context) {
		tooltip.add(Text.translatable("item.frozen.elsa_glove.tip.blast").formatted(Formatting.AQUA));
		tooltip.add(Text.translatable("item.frozen.elsa_glove.tip.bridge").formatted(Formatting.AQUA));
		tooltip.add(Text.translatable("item.frozen.elsa_glove.tip.spikes").formatted(Formatting.AQUA));
	}
}
