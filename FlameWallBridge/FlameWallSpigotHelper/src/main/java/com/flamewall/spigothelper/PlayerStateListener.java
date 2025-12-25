package com.flamewall.spigothelper;

import com.flamewall.spigothelper.util.TargetScanner;
import me.clip.placeholderapi.PlaceholderAPI;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.json.JSONObject;

import java.util.List;

public class PlayerStateListener implements Listener {
    private final FlameWallSpigotHelper plugin;

    private static boolean initialTargetsSent = false;
    public PlayerStateListener(FlameWallSpigotHelper plugin) {
        this.plugin = plugin;
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        Bukkit.getScheduler().runTaskLater(this.plugin, () -> {

            if (!initialTargetsSent) {
                plugin.getLogger().info("First player joined. Sending achievement targets to backend...");
                sendInitialTargets(player);
                initialTargetsSent = true;
            }
            String rank = PlaceholderAPI.setPlaceholders(player, "%luckperms_primary_group_name%");
            sendRankUpdate(player, rank);
        }, 40L);
    }
    private void sendInitialTargets(Player player) {

        List<JSONObject> payloads = TargetScanner.scanInChunks();

        plugin.getLogger().info("Sending " + payloads.size() + " chunks of achievement targets to proxy...");
        for (JSONObject payload : payloads) {
            plugin.forwardMessageToProxy(player, "RegisterTargets", payload.toString());
        }

        plugin.getLogger().info("Successfully sent all achievement target chunks.");
    }
    private void sendRankUpdate(Player player, String rank) {
        if (player == null || rank == null || rank.isEmpty()) return;
        JSONObject payload = new JSONObject();
        payload.put("minecraftUuid", player.getUniqueId().toString());
        payload.put("newRankSystemName", rank);
        plugin.forwardMessageToProxy(player, "RankSync", payload.toString());
    }
}