package com.flamewall.spigothelper;

import com.google.common.io.ByteArrayDataInput;
import com.google.common.io.ByteArrayDataOutput;
import com.google.common.io.ByteStreams;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.plugin.messaging.PluginMessageListener;
import org.jetbrains.annotations.NotNull;
import java.io.ByteArrayInputStream;
import java.io.DataInputStream;

public class FlameWallSpigotHelper extends JavaPlugin implements PluginMessageListener {

    @Override
    public void onEnable() {
        saveDefaultConfig();
        if (getServer().getPluginManager().getPlugin("PlaceholderAPI") == null) {
            getLogger().severe("!!! PlaceholderAPI не найден! Плагин не сможет синхронизировать ранги. !!!");
        }
        getServer().getPluginManager().registerEvents(new PlayerStateListener(this), this);
        getServer().getPluginManager().registerEvents(new GameEventListener(this), this);
        this.getServer().getMessenger().registerIncomingPluginChannel(this, "flamewall:main", this);
        this.getServer().getMessenger().registerOutgoingPluginChannel(this, "flamewall:main");
        getLogger().info("FlameWall Spigot Helper включен.");
    }

    @Override
    public void onPluginMessageReceived(@NotNull String channel, @NotNull Player player, @NotNull byte[] message) {

        if (!channel.equals("flamewall:main")) return;
        ByteArrayDataInput in = ByteStreams.newDataInput(message);
        String subChannel = in.readUTF();
        try {
            if ("ExecuteCommand".equals(subChannel)) {
                String commandToExecute = in.readUTF();
                Bukkit.getScheduler().runTask(this, () -> Bukkit.dispatchCommand(Bukkit.getConsoleSender(), commandToExecute));
            }
        } catch (Exception e) {
            getLogger().severe("Не удалось обработать сообщение от прокси-плагина: " + e.getMessage());
        }
    }

    public void forwardMessageToProxy(Player player, String subChannel, String data) {
        if (player == null || !player.isOnline()) {
            player = Bukkit.getOnlinePlayers().stream().findAny().orElse(null);
            if (player == null) {
                getLogger().warning("Cannot forward message to proxy, no players online.");
                return;
            }
        }
        ByteArrayDataOutput out = ByteStreams.newDataOutput();
        out.writeUTF(subChannel);
        out.writeUTF(data);
        player.sendPluginMessage(this, "flamewall:main", out.toByteArray());
    }
}