package com.flamewall.spigothelper;

import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.inventory.CraftItemEvent;
import org.bukkit.event.player.PlayerItemConsumeEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataContainer;
import org.bukkit.persistence.PersistentDataType;
import org.json.JSONObject;
import org.json.JSONArray;

import java.util.HashMap;
import java.util.Map;

public class GameEventListener implements Listener {

    private final FlameWallSpigotHelper plugin;

    public GameEventListener(FlameWallSpigotHelper plugin) {
        this.plugin = plugin;
    }

    private void queueEvent(Player player, String eventType, String target) {
        JSONObject batchPayload = new JSONObject();
        String serverGroup = plugin.getConfig().getString("server-group", "default");
        batchPayload.put("server_group", serverGroup);

        batchPayload.put("playerUuid", player.getUniqueId().toString());

        JSONObject singleEvent = new JSONObject();
        singleEvent.put("eventType", eventType + ":" + target);

        JSONArray eventsArray = new JSONArray();
        eventsArray.put(singleEvent);

        batchPayload.put("events", eventsArray);
        batchPayload.put("snapshot", createPlayerAndWorldSnapshot(player));

        plugin.forwardMessageToProxy(player, "GameEvent", batchPayload.toString());
    }
    private JSONObject createPlayerAndWorldSnapshot(Player player) {
        JSONObject snapshot = new JSONObject();
        snapshot.put("player", createPlayerState(player));
        snapshot.put("world", createWorldState(player.getWorld()));
        return snapshot;
    }
    @EventHandler
    public void onEntityDeath(EntityDeathEvent event) {
        Player killer = event.getEntity().getKiller();
        if (killer == null) return;
        queueEvent(killer, "GAME_EVENT:PLAYER_KILL_ENTITY", "vanilla:kill:" + event.getEntity().getType().name());
    }

    @EventHandler
    public void onBlockBreak(BlockBreakEvent event) {
        queueEvent(event.getPlayer(), "GAME_EVENT:BLOCK_BREAK", "vanilla:break:" + event.getBlock().getType().name());
    }

    @EventHandler
    public void onItemCraft(CraftItemEvent event) {
        if (!(event.getWhoClicked() instanceof Player)) return;
        Player player = (Player) event.getWhoClicked();
        queueEvent(player, "GAME_EVENT:ITEM_CRAFT", "vanilla:item:" + event.getRecipe().getResult().getType().name());
    }

    @EventHandler
    public void onItemConsume(PlayerItemConsumeEvent event) {
        queueEvent(event.getPlayer(), "GAME_EVENT:ITEM_CONSUME", "vanilla:item:" + event.getItem().getType().name());
    }

    public static JSONObject createPlayerState(Player p) {
        if (p == null) return null;
        JSONObject state = new JSONObject();
        state.put("location", new JSONObject().put("x", p.getLocation().getX()).put("y", p.getLocation().getY()).put("z", p.getLocation().getZ()));
        state.put("health", p.getHealth());
        state.put("level", p.getLevel());
        state.put("main_hand", createItemState(p.getInventory().getItemInMainHand()));
        JSONObject armor = new JSONObject();
        armor.put("helmet", createItemState(p.getInventory().getHelmet()));
        armor.put("chestplate", createItemState(p.getInventory().getChestplate()));
        armor.put("leggings", createItemState(p.getInventory().getLeggings()));
        armor.put("boots", createItemState(p.getInventory().getBoots()));
        state.put("armor", armor);
        Map<String, Integer> itemCounts = new HashMap<>();
        for (ItemStack item : p.getInventory().getContents()) {
            if (item != null && item.getType() != Material.AIR) {
                String itemName = item.getType().name();
                itemCounts.put(itemName, itemCounts.getOrDefault(itemName, 0) + item.getAmount());
            }
        }
        state.put("inventory_summary", new JSONObject(itemCounts));

        return state;
    }

    public static JSONObject createWorldState(World w) {
        if (w == null) return null;
        JSONObject state = new JSONObject();
        state.put("name", w.getName());
        state.put("time", w.getTime());
        state.put("weather", w.isThundering() ? "THUNDER" : (w.hasStorm() ? "RAIN" : "CLEAR"));
        return state;
    }

    public static JSONObject createItemState(ItemStack item) {
        if (item == null || item.getType() == Material.AIR) {
            return null;
        }
        JSONObject state = new JSONObject();
        state.put("type", item.getType().name());
        state.put("amount", item.getAmount());

        if (item.hasItemMeta()) {
            ItemMeta meta = item.getItemMeta();
            if (meta.hasDisplayName()) {
                state.put("name", ChatColor.stripColor(meta.getDisplayName()));
            }
            if (meta.hasEnchants()) {
                JSONObject enchants = new JSONObject();
                for (Map.Entry<Enchantment, Integer> entry : meta.getEnchants().entrySet()) {
                    enchants.put(entry.getKey().getKey().getKey().toUpperCase(), entry.getValue());
                }
                state.put("enchantments", enchants);
            }

            PersistentDataContainer container = meta.getPersistentDataContainer();
            if (!container.isEmpty()) {
                state.put("nbt", readNbt(container));
            }
        }
        return state;
    }

    public static JSONObject createEntityState(Entity e) {
        if (e == null) return null;
        JSONObject state = new JSONObject();
        state.put("type", e.getType().name());
        if (e.getCustomName() != null) {
            state.put("name", ChatColor.stripColor(e.getCustomName()));
        }

        PersistentDataContainer container = e.getPersistentDataContainer();
        if (!container.isEmpty()) {
            state.put("nbt", readNbt(container));
        }
        return state;
    }
    private static JSONObject readNbt(PersistentDataContainer container) {
        JSONObject nbtData = new JSONObject();
        for (NamespacedKey key : container.getKeys()) {
            if (container.has(key, PersistentDataType.STRING)) {
                nbtData.put(key.getKey(), container.get(key, PersistentDataType.STRING));
            } else if (container.has(key, PersistentDataType.INTEGER)) {
                nbtData.put(key.getKey(), container.get(key, PersistentDataType.INTEGER));
            } else if (container.has(key, PersistentDataType.DOUBLE)) {
                nbtData.put(key.getKey(), container.get(key, PersistentDataType.DOUBLE));
            }
        }
        return nbtData;
    }
}