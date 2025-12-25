package com.flamewall.proxybridge.command;

import com.flamewall.proxybridge.FlameWallProxyBridge;
import com.velocitypowered.api.command.CommandSource;
import com.velocitypowered.api.command.SimpleCommand;
import com.velocitypowered.api.proxy.Player;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.json.JSONObject;

public class LinkCommand implements SimpleCommand {

    private final FlameWallProxyBridge plugin;

    public LinkCommand(FlameWallProxyBridge plugin) {
        this.plugin = plugin;
    }

    @Override
    public void execute(Invocation invocation) {
        CommandSource source = invocation.source();
        String[] args = invocation.arguments();

        if (!(source instanceof Player)) {
            source.sendMessage(Component.text("This command can only be used by a player.").color(NamedTextColor.RED));
            return;
        }

        if (args.length != 1) {
            source.sendMessage(Component.text("Usage: /link <code>").color(NamedTextColor.RED));
            return;
        }

        Player player = (Player) source;
        String code = args[0];

        try {
            JSONObject payload = new JSONObject();
            payload.put("code", code);
            payload.put("minecraftUuid", player.getUniqueId().toString());
            payload.put("minecraftUsername", player.getUsername());
            plugin.sendJsonPayload("linkAccount", payload);

            player.sendMessage(Component.text("Sent link request to the website. Please check the website for confirmation.").color(NamedTextColor.YELLOW));
        } catch (Exception e) {
            player.sendMessage(Component.text("An internal plugin error occurred.").color(NamedTextColor.RED));
            e.printStackTrace();
        }
    }
    @Override
    public boolean hasPermission(Invocation invocation) {
        return true;
    }
}